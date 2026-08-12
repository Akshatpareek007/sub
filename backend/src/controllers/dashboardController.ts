import { Response } from 'express';
import { prisma } from '../db';
import { AuthRequest } from '../types';

export const getDashboardSummary = async (req: AuthRequest, res: Response) => {
  try {
    const [
      totalCustomers,
      activeCustomers,
      totalProducts,
      allProducts,
      totalChallans,
      confirmedChallans,
      recentStockLogs,
      recentChallans,
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.customer.count({ where: { status: 'ACTIVE' } }),
      prisma.product.count(),
      prisma.product.findMany({ select: { currentStock: true, minStockAlert: true, unitPrice: true } }),
      prisma.challan.count(),
      prisma.challan.aggregate({
        where: { status: 'CONFIRMED' },
        _sum: { totalAmount: true, totalQuantity: true },
      }),
      prisma.stockLog.findMany({
        take: 6,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { name: true, sku: true } },
          createdByUser: { select: { name: true } },
        },
      }),
      prisma.challan.findMany({
        take: 6,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { name: true, businessName: true } },
        },
      }),
    ]);

    const lowStockCount = allProducts.filter((p) => p.currentStock <= p.minStockAlert).length;
    const totalInventoryValue = allProducts.reduce((sum, p) => sum + p.currentStock * p.unitPrice, 0);

    return res.json({
      success: true,
      data: {
        summary: {
          totalCustomers,
          activeCustomers,
          totalProducts,
          lowStockCount,
          totalInventoryValue,
          totalChallans,
          confirmedRevenue: confirmedChallans._sum.totalAmount || 0,
          confirmedItemsSold: confirmedChallans._sum.totalQuantity || 0,
        },
        recentStockLogs,
        recentChallans,
      },
    });
  } catch (error) {
    console.error('Dashboard Error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch dashboard metrics' });
  }
};
