import { Response } from 'express';
import { prisma } from '../db';
import { productSchema, stockAdjustmentSchema, AuthRequest } from '../types';

export const getProducts = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    const category = (req.query.category as string) || '';
    const lowStockOnly = req.query.lowStock === 'true';

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { category: { contains: search } },
        { location: { contains: search } },
      ];
    }

    if (category) {
      where.category = category;
    }

    let products = await prisma.product.findMany({
      where,
      skip: lowStockOnly ? 0 : skip,
      take: lowStockOnly ? 1000 : limit,
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { stockLogs: true },
        },
      },
    });

    if (lowStockOnly) {
      products = products.filter((p) => p.currentStock <= p.minStockAlert);
    }

    const total = lowStockOnly ? products.length : await prisma.product.count({ where });

    if (lowStockOnly) {
      products = products.slice(skip, skip + limit);
    }

    return res.json({
      success: true,
      data: products,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get Products Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch products' });
  }
};

export const getProductById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        stockLogs: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            createdByUser: {
              select: { id: true, name: true, role: true },
            },
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    return res.json({ success: true, data: product });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch product details' });
  }
};

export const createProduct = async (req: AuthRequest, res: Response) => {
  try {
    const parseResult = productSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: parseResult.error.errors,
      });
    }

    const data = parseResult.data;

    const existingSku = await prisma.product.findUnique({ where: { sku: data.sku } });
    if (existingSku) {
      return res.status(400).json({ success: false, error: `Product with SKU "${data.sku}" already exists` });
    }

    const product = await prisma.product.create({
      data: {
        name: data.name,
        sku: data.sku,
        category: data.category,
        unitPrice: data.unitPrice,
        currentStock: data.currentStock,
        minStockAlert: data.minStockAlert,
        location: data.location,
      },
    });

    // Log initial stock if > 0
    if (data.currentStock > 0) {
      await prisma.stockLog.create({
        data: {
          productId: product.id,
          quantityChanged: data.currentStock,
          type: 'IN',
          reason: 'Initial Stock Creation',
          createdByUserId: req.user!.userId,
        },
      });
    }

    return res.status(201).json({ success: true, message: 'Product created', data: product });
  } catch (error) {
    console.error('Create Product Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to create product' });
  }
};

export const updateProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const parseResult = productSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: parseResult.error.errors,
      });
    }

    const data = parseResult.data;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    if (existing.sku !== data.sku) {
      const skuCheck = await prisma.product.findUnique({ where: { sku: data.sku } });
      if (skuCheck) {
        return res.status(400).json({ success: false, error: `SKU "${data.sku}" is already in use by another product` });
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        sku: data.sku,
        category: data.category,
        unitPrice: data.unitPrice,
        minStockAlert: data.minStockAlert,
        location: data.location,
      },
    });

    return res.json({ success: true, message: 'Product updated', data: product });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to update product' });
  }
};

export const adjustStock = async (req: AuthRequest, res: Response) => {
  try {
    const { id: productId } = req.params;
    const parseResult = stockAdjustmentSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: parseResult.error.errors,
      });
    }

    const { quantityChanged, type, reason } = parseResult.data;

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    let newStock = product.currentStock;
    if (type === 'IN') {
      newStock += quantityChanged;
    } else {
      if (product.currentStock < quantityChanged) {
        return res.status(400).json({
          success: false,
          error: `Insufficient stock. Current stock is ${product.currentStock}, attempted OUT quantity is ${quantityChanged}.`,
        });
      }
      newStock -= quantityChanged;
    }

    // Execute atomic transaction for stock update + log creation
    const [updatedProduct, stockLog] = await prisma.$transaction([
      prisma.product.update({
        where: { id: productId },
        data: { currentStock: newStock },
      }),
      prisma.stockLog.create({
        data: {
          productId,
          quantityChanged,
          type,
          reason,
          createdByUserId: req.user!.userId,
        },
        include: {
          createdByUser: { select: { id: true, name: true, role: true } },
        },
      }),
    ]);

    return res.json({
      success: true,
      message: `Stock updated successfully (${type} ${quantityChanged})`,
      data: {
        product: updatedProduct,
        log: stockLog,
      },
    });
  } catch (error) {
    console.error('Adjust Stock Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to adjust stock' });
  }
};

export const getStockLogs = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const productId = req.query.productId as string;
    const type = req.query.type as string;

    const skip = (page - 1) * limit;

    const where: any = {};
    if (productId) where.productId = productId;
    if (type) where.type = type;

    const [logs, total] = await Promise.all([
      prisma.stockLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { id: true, name: true, sku: true } },
          createdByUser: { select: { id: true, name: true, role: true } },
        },
      }),
      prisma.stockLog.count({ where }),
    ]);

    return res.json({
      success: true,
      data: logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to fetch stock logs' });
  }
};
