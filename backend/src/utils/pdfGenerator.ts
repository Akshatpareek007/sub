import PDFDocument from 'pdfkit';
import { Response } from 'express';

export function generateChallanPDF(challan: any, res: Response) {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `inline; filename=Challan_${challan.challanNumber}.pdf`
  );

  doc.pipe(res);

  // Header Banner
  doc
    .fillColor('#1e293b')
    .fontSize(22)
    .font('Helvetica-Bold')
    .text('MINI ERP & CRM PORTAL', 50, 45);

  doc
    .fillColor('#64748b')
    .fontSize(10)
    .font('Helvetica')
    .text('Wholesale & Distribution Operations', 50, 70);

  doc
    .fillColor('#0284c7')
    .fontSize(16)
    .font('Helvetica-Bold')
    .text('SALES CHALLAN / INVOICE', 350, 45, { align: 'right' });

  doc
    .fillColor('#334155')
    .fontSize(10)
    .font('Helvetica')
    .text(`Number: ${challan.challanNumber}`, 350, 68, { align: 'right' })
    .text(`Date: ${new Date(challan.createdAt).toLocaleDateString()}`, 350, 83, { align: 'right' })
    .text(`Status: ${challan.status}`, 350, 98, { align: 'right' });

  doc.moveTo(50, 120).lineTo(545, 120).strokeColor('#e2e8f0').lineWidth(1).stroke();

  // Customer & Business Details Snapshot Parsing
  let customerData: any = {};
  try {
    customerData = typeof challan.customerSnapshot === 'string'
      ? JSON.parse(challan.customerSnapshot)
      : challan.customerSnapshot;
  } catch (e) {
    customerData = { name: challan.customer?.name || 'N/A' };
  }

  doc.fontSize(12).font('Helvetica-Bold').fillColor('#0f172a').text('CUSTOMER INFORMATION', 50, 135);
  doc.fontSize(10).font('Helvetica').fillColor('#334155');
  doc.text(`Customer Name: ${customerData.name || 'N/A'}`, 50, 155);
  doc.text(`Business Name: ${customerData.businessName || 'N/A'}`, 50, 170);
  doc.text(`Mobile: ${customerData.mobile || 'N/A'} | Email: ${customerData.email || 'N/A'}`, 50, 185);
  if (customerData.gstNumber) {
    doc.text(`GSTIN: ${customerData.gstNumber}`, 50, 200);
  }
  doc.text(`Address: ${customerData.address || 'N/A'}`, 50, customerData.gstNumber ? 215 : 200);

  const startY = customerData.gstNumber ? 245 : 230;
  doc.moveTo(50, startY).lineTo(545, startY).strokeColor('#e2e8f0').stroke();

  // Table Headers
  const tableTop = startY + 15;
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#0f172a');
  doc.text('#', 50, tableTop);
  doc.text('Item Description / SKU', 80, tableTop);
  doc.text('Qty', 320, tableTop, { width: 50, align: 'right' });
  doc.text('Unit Price', 380, tableTop, { width: 70, align: 'right' });
  doc.text('Amount (₹)', 460, tableTop, { width: 85, align: 'right' });

  doc.moveTo(50, tableTop + 15).lineTo(545, tableTop + 15).strokeColor('#cbd5e1').stroke();

  let position = tableTop + 25;
  doc.font('Helvetica').fontSize(9).fillColor('#334155');

  challan.items.forEach((item: any, index: number) => {
    let itemSnapshot: any = {};
    try {
      itemSnapshot = typeof item.productSnapshot === 'string'
        ? JSON.parse(item.productSnapshot)
        : item.productSnapshot;
    } catch (e) {
      itemSnapshot = { name: item.product?.name || 'Product', sku: item.product?.sku || '' };
    }

    doc.text((index + 1).toString(), 50, position);
    doc.text(`${itemSnapshot.name} (${itemSnapshot.sku})`, 80, position, { width: 230 });
    doc.text(item.quantity.toString(), 320, position, { width: 50, align: 'right' });
    doc.text(`₹${item.unitPrice.toFixed(2)}`, 380, position, { width: 70, align: 'right' });
    doc.text(`₹${item.amount.toFixed(2)}`, 460, position, { width: 85, align: 'right' });

    position += 20;
  });

  doc.moveTo(50, position + 5).lineTo(545, position + 5).strokeColor('#cbd5e1').stroke();

  // Summary Totals
  const summaryTop = position + 15;
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#0f172a');
  doc.text(`Total Quantity: ${challan.totalQuantity}`, 50, summaryTop);
  doc.text(`Grand Total: ₹${challan.totalAmount.toFixed(2)}`, 350, summaryTop, { width: 195, align: 'right' });

  // Footer Note
  doc
    .fontSize(9)
    .font('Helvetica-Oblique')
    .fillColor('#94a3b8')
    .text('This is a computer-generated challan/invoice. Created by Mini ERP Operations Portal.', 50, 750, {
      align: 'center',
      width: 495,
    });

  doc.end();
}
