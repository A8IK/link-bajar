const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { Invoice } = require('../models');
const ids = require('../utils/ids');

const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads', 'invoices');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const renderPdf = (invoice, user, order) =>
  new Promise((resolve, reject) => {
    const filePath = path.join(UPLOAD_DIR, `${invoice.invoiceNumber}.pdf`);
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = fs.createWriteStream(filePath);
    stream.on('finish', () => resolve(filePath));
    stream.on('error', reject);
    doc.pipe(stream);

    doc.fillColor('#2563eb').fontSize(24).font('Helvetica-Bold').text('Link Bajar', 50, 50);
    doc.fillColor('#0f172a').fontSize(20).text('Invoice', { align: 'right' });
    doc.fillColor('#475569').fontSize(10).text(`#${invoice.invoiceNumber}`, { align: 'right' });

    doc.moveDown(2);
    doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text('Billed to');
    doc
      .font('Helvetica')
      .fontSize(11)
      .fillColor('#475569')
      .text(`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email)
      .text(user.email)
      .text(user.country || '');

    doc.moveDown();
    doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text('Items');

    const y = doc.y + 8;
    doc
      .strokeColor('#e2e8f0')
      .lineWidth(1)
      .moveTo(50, y)
      .lineTo(545, y)
      .stroke();
    doc.moveDown(0.6);

    const items = invoice.lineItems?.length
      ? invoice.lineItems
      : [
          {
            description: `${order?.orderType?.replace('_', ' ') || 'Order'} on ${order?.orderedSite || '-'}`,
            quantity: 1,
            unitPrice: Number(invoice.amount),
            total: Number(invoice.amount),
          },
        ];

    items.forEach((it) => {
      const startY = doc.y;
      doc.fillColor('#0f172a').font('Helvetica').fontSize(11).text(it.description, 50, startY, { width: 320 });
      doc.text(String(it.quantity || 1), 380, startY, { width: 50, align: 'right' });
      doc.text(`$${Number(it.unitPrice).toFixed(2)}`, 430, startY, { width: 60, align: 'right' });
      doc.text(`$${Number(it.total).toFixed(2)}`, 490, startY, { width: 55, align: 'right' });
      doc.moveDown(0.5);
    });

    doc.moveDown();
    doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(14).text(
      `Total  $${Number(invoice.amount).toFixed(2)} ${invoice.currency}`,
      { align: 'right' },
    );

    doc.moveDown(2);
    doc
      .fontSize(9)
      .fillColor('#94a3b8')
      .font('Helvetica')
      .text(
        `Issued ${new Date(invoice.issuedAt).toLocaleDateString()} · Status: ${invoice.status.toUpperCase()}`,
        { align: 'center' },
      );

    doc.end();
  });

const createForOrder = async ({ order, user, lineItems }) => {
  const invoice = await Invoice.create({
    invoiceNumber: ids.invoiceNumber(),
    orderId: order.id,
    userId: user.id,
    amount: order.amount,
    currency: 'USD',
    status: order.paymentStatus === 'paid' ? 'paid' : 'issued',
    issuedAt: new Date(),
    lineItems: lineItems || [],
  });
  const pdfPath = await renderPdf(invoice, user, order);
  invoice.pdfPath = pdfPath;
  await invoice.save();
  return invoice;
};

const streamPdf = (invoice, res) => {
  if (!invoice.pdfPath || !fs.existsSync(invoice.pdfPath)) {
    res.status(404).json({ success: false, message: 'PDF not found' });
    return;
  }
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.pdf"`);
  fs.createReadStream(invoice.pdfPath).pipe(res);
};

module.exports = { createForOrder, streamPdf, renderPdf };
