import { Response } from 'express';
import { prisma } from '../db';
import { customerSchema, followUpNoteSchema, AuthRequest } from '../types';

export const getCustomers = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    const status = (req.query.status as string) || '';
    const customerType = (req.query.customerType as string) || '';

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { mobile: { contains: search } },
        { businessName: { contains: search } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (customerType) {
      where.customerType = customerType;
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          _count: {
            select: { followUpNotes: true, challans: true },
          },
        },
      }),
      prisma.customer.count({ where }),
    ]);

    return res.json({
      success: true,
      data: customers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get Customers Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch customers' });
  }
};

export const getCustomerById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        followUpNotes: {
          orderBy: { createdAt: 'desc' },
          include: {
            createdByUser: {
              select: { id: true, name: true, role: true, email: true },
            },
          },
        },
        challans: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            challanNumber: true,
            status: true,
            totalQuantity: true,
            totalAmount: true,
            createdAt: true,
          },
        },
      },
    });

    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    return res.json({ success: true, data: customer });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch customer details' });
  }
};

export const createCustomer = async (req: AuthRequest, res: Response) => {
  try {
    const parseResult = customerSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: parseResult.error.errors,
      });
    }

    const data = parseResult.data;

    const customer = await prisma.customer.create({
      data: {
        name: data.name,
        mobile: data.mobile,
        email: data.email,
        businessName: data.businessName,
        gstNumber: data.gstNumber || null,
        customerType: data.customerType,
        address: data.address,
        status: data.status,
        followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
        notes: data.notes || null,
      },
    });

    return res.status(201).json({ success: true, message: 'Customer created', data: customer });
  } catch (error: any) {
    console.error('Create Customer Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to create customer' });
  }
};

export const updateCustomer = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const parseResult = customerSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: parseResult.error.errors,
      });
    }

    const data = parseResult.data;

    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name: data.name,
        mobile: data.mobile,
        email: data.email,
        businessName: data.businessName,
        gstNumber: data.gstNumber || null,
        customerType: data.customerType,
        address: data.address,
        status: data.status,
        followUpDate: data.followUpDate ? new Date(data.followUpDate) : null,
        notes: data.notes || null,
      },
    });

    return res.json({ success: true, message: 'Customer updated', data: customer });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to update customer' });
  }
};

export const addFollowUpNote = async (req: AuthRequest, res: Response) => {
  try {
    const { id: customerId } = req.params;
    const parseResult = followUpNoteSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: parseResult.error.errors,
      });
    }

    const { note, nextFollowUpDate } = parseResult.data;

    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    const followUpNote = await prisma.followUpNote.create({
      data: {
        customerId,
        note,
        createdByUserId: req.user!.userId,
      },
      include: {
        createdByUser: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    if (nextFollowUpDate !== undefined) {
      await prisma.customer.update({
        where: { id: customerId },
        data: {
          followUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : null,
        },
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Follow-up note added',
      data: followUpNote,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to add follow-up note' });
  }
};
