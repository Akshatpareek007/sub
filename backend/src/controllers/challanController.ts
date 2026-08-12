import { Response } from 'express';
import { prisma } from '../db';
import { challanSchema, updateChallanStatusSchema, AuthRequest } from '../types';
import { generateChallanPDF } from '../utils/pdfGenerator';

export const getChallans = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    const status = (req.query.status as string) || '';

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { challanNumber: { contains: search } },
        { customer: { name: { contains: search } } },
        { customer: { businessName: { contains: search } } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [challans, total] = await Promise.all([
      prisma.challan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true, businessName: true, mobile: true, email: true } },
          createdByUser: { select: { id: true, name: true, role: true } },
          _count: { select: { items: true } },
        },
      }),
      prisma.challan.count({ where }),
    ]);

    const formattedChallans = challans.map((c) => ({
      ...c,
      customerSnapshot: parseJsonSafe(c.customerSnapshot),
    }));

    return res.json({
      success: true,
      data: formattedChallans,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get Challans Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch challans' });
  }
};

export const getChallanById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const challan = await prisma.challan.findUnique({
      where: { id },
      include: {
        customer: true,
        createdByUser: { select: { id: true, name: true, email: true, role: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true, currentStock: true } },
          },
        },
      },
    });

    if (!challan) {
      return res.status(404).json({ success: false, error: 'Challan not found' });
    }

    const formattedChallan = {
      ...challan,
      customerSnapshot: parseJsonSafe(challan.customerSnapshot),
      items: challan.items.map((item) => ({
        ...item,
        productSnapshot: parseJsonSafe(item.productSnapshot),
      })),
    };

    return res.json({ success: true, data: formattedChallan });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch challan details' });
  }
};

export const createChallan = async (req: AuthRequest, res: Response) => {
  try {
    const parseResult = challanSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: parseResult.error.errors,
      });
    }

    const { customerId, status, items } = parseResult.data;

    // Fetch customer for snapshot
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    const customerSnapshot = JSON.stringify({
      id: customer.id,
      name: customer.name,
      mobile: customer.mobile,
      email: customer.email,
      businessName: customer.businessName,
      gstNumber: customer.gstNumber,
      customerType: customer.customerType,
      address: customer.address,
    });

    // Extract product IDs
    const productIds = items.map((i) => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== productIds.length) {
      return res.status(400).json({ success: false, error: 'One or more selected products do not exist' });
    }

    const productMap = new Map(products.map((p) => [p.id, p]));

    // Check stock if CONFIRMED status requested
    if (status === 'CONFIRMED') {
      for (const item of items) {
        const prod = productMap.get(item.productId)!;
        if (prod.currentStock < item.quantity) {
          return res.status(400).json({
            success: false,
            error: `Insufficient stock for product "${prod.name}" (${prod.sku}). Available: ${prod.currentStock}, Requested: ${item.quantity}`,
          });
        }
      }
    }

    // Auto-generate Challan Number (CH-YYYYMM-XXXX)
    const dateStr = new Date().toISOString().slice(0, 7).replace('-', '');
    const count = await prisma.challan.count();
    const challanNumber = `CH-${dateStr}-${(count + 1).toString().padStart(4, '0')}`;

    let totalQuantity = 0;
    let totalAmount = 0;

    const preparedItems = items.map((item) => {
      const prod = productMap.get(item.productId)!;
      const unitPrice = prod.unitPrice;
      const amount = unitPrice * item.quantity;
      totalQuantity += item.quantity;
      totalAmount += amount;

      const productSnapshot = JSON.stringify({
        id: prod.id,
        name: prod.name,
        sku: prod.sku,
        category: prod.category,
        unitPrice: prod.unitPrice,
        location: prod.location,
      });

      return {
        productId: prod.id,
        quantity: item.quantity,
        unitPrice,
        amount,
        productSnapshot,
      };
    });

    // DB Transaction
    const newChallan = await prisma.$transaction(async (tx) => {
      const created = await tx.challan.create({
        data: {
          challanNumber,
          customerId,
          customerSnapshot,
          status,
          totalQuantity,
          totalAmount,
          createdByUserId: req.user!.userId,
          items: {
            create: preparedItems,
          },
        },
        include: { items: true },
      });

      // Stock deduction if CONFIRMED
      if (status === 'CONFIRMED') {
        for (const item of items) {
          const prod = productMap.get(item.productId)!;
          await tx.product.update({
            where: { id: prod.id },
            data: { currentStock: { decrement: item.quantity } },
          });

          await tx.stockLog.create({
            data: {
              productId: prod.id,
              quantityChanged: item.quantity,
              type: 'OUT',
              reason: `Challan #${challanNumber} Confirmation`,
              createdByUserId: req.user!.userId,
            },
          });
        }
      }

      return created;
    });

    return res.status(201).json({
      success: true,
      message: `Challan #${newChallan.challanNumber} created as ${status}`,
      data: newChallan,
    });
  } catch (error: any) {
    console.error('Create Challan Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to create sales challan' });
  }
};

export const updateChallanStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const parseResult = updateChallanStatusSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: parseResult.error.errors,
      });
    }

    const { status: targetStatus } = parseResult.data;

    const challan = await prisma.challan.findUnique({
      where: { id },
      include: { items: { include: { product: true } } },
    });

    if (!challan) {
      return res.status(404).json({ success: false, error: 'Challan not found' });
    }

    if (challan.status === targetStatus) {
      return res.status(400).json({ success: false, error: `Challan is already in status "${targetStatus}"` });
    }

    if (challan.status === 'CANCELLED') {
      return res.status(400).json({ success: false, error: 'Cancelled challan status cannot be altered' });
    }

    // Changing DRAFT -> CONFIRMED
    if (challan.status === 'DRAFT' && targetStatus === 'CONFIRMED') {
      // Validate stock availability
      for (const item of challan.items) {
        if (item.product.currentStock < item.quantity) {
          return res.status(400).json({
            success: false,
            error: `Insufficient stock for "${item.product.name}" (${item.product.sku}). Available: ${item.product.currentStock}, Needed: ${item.quantity}`,
          });
        }
      }

      const updated = await prisma.$transaction(async (tx) => {
        const resChallan = await tx.challan.update({
          where: { id },
          data: { status: 'CONFIRMED' },
        });

        for (const item of challan.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: { decrement: item.quantity } },
          });

          await tx.stockLog.create({
            data: {
              productId: item.productId,
              quantityChanged: item.quantity,
              type: 'OUT',
              reason: `Challan #${challan.challanNumber} Confirmed`,
              createdByUserId: req.user!.userId,
            },
          });
        }

        return resChallan;
      });

      return res.json({
        success: true,
        message: `Challan #${challan.challanNumber} status updated to CONFIRMED`,
        data: updated,
      });
    }

    // Changing CONFIRMED -> CANCELLED
    if (challan.status === 'CONFIRMED' && targetStatus === 'CANCELLED') {
      const updated = await prisma.$transaction(async (tx) => {
        const resChallan = await tx.challan.update({
          where: { id },
          data: { status: 'CANCELLED' },
        });

        // Restore stock
        for (const item of challan.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: { increment: item.quantity } },
          });

          await tx.stockLog.create({
            data: {
              productId: item.productId,
              quantityChanged: item.quantity,
              type: 'IN',
              reason: `Challan #${challan.challanNumber} Cancellation Reversal`,
              createdByUserId: req.user!.userId,
            },
          });
        }

        return resChallan;
      });

      return res.json({
        success: true,
        message: `Challan #${challan.challanNumber} status updated to CANCELLED and stock restored`,
        data: updated,
      });
    }

    // Simple DRAFT -> CANCELLED
    const updated = await prisma.challan.update({
      where: { id },
      data: { status: targetStatus },
    });

    return res.json({
      success: true,
      message: `Challan status updated to ${targetStatus}`,
      data: updated,
    });
  } catch (error) {
    console.error('Update Challan Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to update challan status' });
  }
};

export const exportChallanPDF = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const challan = await prisma.challan.findUnique({
      where: { id },
      include: {
        customer: true,
        createdByUser: { select: { id: true, name: true, email: true } },
        items: { include: { product: true } },
      },
    });

    if (!challan) {
      return res.status(404).json({ success: false, error: 'Challan not found' });
    }

    generateChallanPDF(challan, res);
  } catch (error) {
    console.error('PDF Export Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to generate PDF' });
  }
};

function parseJsonSafe(str: string) {
  try {
    return typeof str === 'string' ? JSON.parse(str) : str;
  } catch (e) {
    return str;
  }
}
