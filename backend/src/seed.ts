import bcrypt from 'bcryptjs';
import { prisma } from './db';

async function seed() {
  console.log('🌱 Seeding Mini ERP + CRM Portal database...');

  // Reset existing data
  await prisma.challanItem.deleteMany();
  await prisma.challan.deleteMany();
  await prisma.stockLog.deleteMany();
  await prisma.product.deleteMany();
  await prisma.followUpNote.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Create Users for all 4 Roles
  const adminUser = await prisma.user.create({
    data: {
      name: 'System Admin',
      email: 'admin@erpcrm.com',
      passwordHash,
      role: 'ADMIN',
    },
  });

  const salesUser = await prisma.user.create({
    data: {
      name: 'Rahul Sharma (Sales Executive)',
      email: 'sales@erpcrm.com',
      passwordHash,
      role: 'SALES',
    },
  });

  const warehouseUser = await prisma.user.create({
    data: {
      name: 'Vikram Singh (Warehouse Mgr)',
      email: 'warehouse@erpcrm.com',
      passwordHash,
      role: 'WAREHOUSE',
    },
  });

  const accountsUser = await prisma.user.create({
    data: {
      name: 'Priya Mehta (Accounts Lead)',
      email: 'accounts@erpcrm.com',
      passwordHash,
      role: 'ACCOUNTS',
    },
  });

  console.log('✅ Users created for all 4 roles (Password: Password123!)');

  // 2. Create Customers
  const customer1 = await prisma.customer.create({
    data: {
      name: 'Apex Wholesale Mart',
      mobile: '+91 9876543210',
      email: 'contact@apexwholesale.com',
      businessName: 'Apex Wholesale Pvt Ltd',
      gstNumber: '27AAACA123411Z5',
      customerType: 'WHOLESALE',
      address: 'Plot 42, Industrial Area Phase II, Mumbai, Maharashtra 400093',
      status: 'ACTIVE',
      followUpDate: new Date(Date.now() + 86400000 * 3), // 3 days from now
      notes: 'Key distributor in Mumbai region. Prefers bulk deliveries on Mondays.',
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      name: 'Metro Retail Stores',
      mobile: '+91 9811223344',
      email: 'procurement@metroretail.in',
      businessName: 'Metro Chains India',
      gstNumber: '07BBBCB567822Z9',
      customerType: 'RETAIL',
      address: 'Shop 104, Connaught Place, New Delhi 110001',
      status: 'ACTIVE',
      followUpDate: new Date(Date.now() + 86400000 * 5),
      notes: 'Interested in quarterly electronics contracts.',
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
      name: 'Star Logistics & Supplies',
      mobile: '+91 9900112233',
      email: 'info@starlogistics.com',
      businessName: 'Star Distribution Hub',
      gstNumber: '29CCCCD999933Z2',
      customerType: 'DISTRIBUTOR',
      address: '88 Electronic City, Bengaluru, Karnataka 560100',
      status: 'LEAD',
      followUpDate: new Date(Date.now() + 86400000 * 1),
      notes: 'Newly onboarded lead. Requested sample catalog and pricing tiers.',
    },
  });

  const customer4 = await prisma.customer.create({
    data: {
      name: 'Globe Hardware Mart',
      mobile: '+91 9777888999',
      email: 'sales@globehardware.com',
      businessName: 'Globe Hardware Enterprises',
      gstNumber: '19DDDDD444444Z1',
      customerType: 'WHOLESALE',
      address: '12 Park Street, Kolkata, West Bengal 700016',
      status: 'INACTIVE',
      notes: 'Pending payment settlement from previous quarter.',
    },
  });

  console.log('✅ Customers created');

  // 3. Create Follow-up Notes
  await prisma.followUpNote.createMany({
    data: [
      {
        customerId: customer1.id,
        note: 'Called purchase department. Confirmed approval for 50x Industrial LED Panels.',
        createdByUserId: salesUser.id,
        createdAt: new Date(Date.now() - 86400000 * 2),
      },
      {
        customerId: customer1.id,
        note: 'Sent updated wholesale price sheet including seasonal discounts.',
        createdByUserId: salesUser.id,
        createdAt: new Date(Date.now() - 86400000 * 1),
      },
      {
        customerId: customer3.id,
        note: 'Initial intro call with Mr. Ramesh. Agreed to follow up with custom quote tomorrow.',
        createdByUserId: salesUser.id,
        createdAt: new Date(Date.now() - 86400000 * 3),
      },
    ],
  });

  console.log('✅ Follow-up notes seeded');

  // 4. Create Products
  const prod1 = await prisma.product.create({
    data: {
      name: 'Industrial LED High Bay Light 150W',
      sku: 'PRD-LED-150W',
      category: 'Electricals & Lighting',
      unitPrice: 2850.0,
      currentStock: 120,
      minStockAlert: 15,
      location: 'Warehouse A - Rack 04',
    },
  });

  const prod2 = await prisma.product.create({
    data: {
      name: 'Heavy Duty Copper Cable 3-Core 100m',
      sku: 'PRD-CAB-CUP3',
      category: 'Electricals & Lighting',
      unitPrice: 4200.0,
      currentStock: 45,
      minStockAlert: 10,
      location: 'Warehouse A - Rack 12',
    },
  });

  const prod3 = await prisma.product.create({
    data: {
      name: 'Modular Smart Switch Board 8-Way',
      sku: 'PRD-SW-MOD8',
      category: 'Hardware & Smart Devices',
      unitPrice: 950.0,
      currentStock: 8, // LOW STOCK TRIGGER
      minStockAlert: 20,
      location: 'Warehouse B - Bin 02',
    },
  });

  const prod4 = await prisma.product.create({
    data: {
      name: 'Digital Multimeter Pro Series',
      sku: 'PRD-TL-MMPRO',
      category: 'Tools & Measuring',
      unitPrice: 1600.0,
      currentStock: 30,
      minStockAlert: 5,
      location: 'Warehouse B - Shelf 01',
    },
  });

  const prod5 = await prisma.product.create({
    data: {
      name: 'Industrial Circuit Breaker MCB 63A',
      sku: 'PRD-MCB-63A',
      category: 'Electricals & Lighting',
      unitPrice: 650.0,
      currentStock: 3, // LOW STOCK TRIGGER
      minStockAlert: 15,
      location: 'Warehouse A - Rack 01',
    },
  });

  console.log('✅ Products seeded (including low-stock alert items)');

  // 5. Stock Movement Logs
  await prisma.stockLog.createMany({
    data: [
      {
        productId: prod1.id,
        quantityChanged: 150,
        type: 'IN',
        reason: 'Vendor Shipment Stock Inflow (PO-8801)',
        createdByUserId: warehouseUser.id,
        createdAt: new Date(Date.now() - 86400000 * 7),
      },
      {
        productId: prod1.id,
        quantityChanged: 30,
        type: 'OUT',
        reason: 'Order Fulfillment - Apex Wholesale',
        createdByUserId: warehouseUser.id,
        createdAt: new Date(Date.now() - 86400000 * 2),
      },
      {
        productId: prod3.id,
        quantityChanged: 50,
        type: 'IN',
        reason: 'Restock Batch Shipment',
        createdByUserId: warehouseUser.id,
        createdAt: new Date(Date.now() - 86400000 * 10),
      },
      {
        productId: prod3.id,
        quantityChanged: 42,
        type: 'OUT',
        reason: 'Dispatch to Retail Chain',
        createdByUserId: warehouseUser.id,
        createdAt: new Date(Date.now() - 86400000 * 3),
      },
    ],
  });

  console.log('✅ Stock Logs seeded');

  // 6. Create Sales Challans with Snapshots
  const customer1Snapshot = JSON.stringify({
    id: customer1.id,
    name: customer1.name,
    mobile: customer1.mobile,
    email: customer1.email,
    businessName: customer1.businessName,
    gstNumber: customer1.gstNumber,
    customerType: customer1.customerType,
    address: customer1.address,
  });

  const customer2Snapshot = JSON.stringify({
    id: customer2.id,
    name: customer2.name,
    mobile: customer2.mobile,
    email: customer2.email,
    businessName: customer2.businessName,
    gstNumber: customer2.gstNumber,
    customerType: customer2.customerType,
    address: customer2.address,
  });

  // Challan 1: Confirmed
  const challan1 = await prisma.challan.create({
    data: {
      challanNumber: 'CH-202608-0001',
      customerId: customer1.id,
      customerSnapshot: customer1Snapshot,
      status: 'CONFIRMED',
      totalQuantity: 20,
      totalAmount: 57000.0,
      createdByUserId: salesUser.id,
      createdAt: new Date(Date.now() - 86400000 * 2),
      items: {
        create: [
          {
            productId: prod1.id,
            quantity: 20,
            unitPrice: 2850.0,
            amount: 57000.0,
            productSnapshot: JSON.stringify({
              id: prod1.id,
              name: prod1.name,
              sku: prod1.sku,
              category: prod1.category,
              unitPrice: prod1.unitPrice,
              location: prod1.location,
            }),
          },
        ],
      },
    },
  });

  // Challan 2: Draft
  const challan2 = await prisma.challan.create({
    data: {
      challanNumber: 'CH-202608-0002',
      customerId: customer2.id,
      customerSnapshot: customer2Snapshot,
      status: 'DRAFT',
      totalQuantity: 10,
      totalAmount: 25600.0,
      createdByUserId: salesUser.id,
      createdAt: new Date(Date.now() - 86400000 * 1),
      items: {
        create: [
          {
            productId: prod2.id,
            quantity: 4,
            unitPrice: 4200.0,
            amount: 16800.0,
            productSnapshot: JSON.stringify({
              id: prod2.id,
              name: prod2.name,
              sku: prod2.sku,
              category: prod2.category,
              unitPrice: prod2.unitPrice,
              location: prod2.location,
            }),
          },
          {
            productId: prod4.id,
            quantity: 5,
            unitPrice: 1600.0,
            amount: 8000.0,
            productSnapshot: JSON.stringify({
              id: prod4.id,
              name: prod4.name,
              sku: prod4.sku,
              category: prod4.category,
              unitPrice: prod4.unitPrice,
              location: prod4.location,
            }),
          },
        ],
      },
    },
  });

  console.log('✅ Sales Challans seeded');
  console.log('🎉 Seed completed successfully!');
}

seed()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
