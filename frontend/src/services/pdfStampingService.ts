import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';

export const pdfStampingService = {
  /**
   * Generates a official vector PDF sheet with architectural border and title block
   */
  async generateOfficialPdf(sheetCode: string, title: string, revNo: string): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([842, 595]); // A4 Landscape
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Outer Border
    page.drawRectangle({
      x: 20,
      y: 20,
      width: 802,
      height: 555,
      borderColor: rgb(0.07, 0.07, 0.07),
      borderWidth: 2,
    });

    // Inner Hairline
    page.drawRectangle({
      x: 24,
      y: 24,
      width: 794,
      height: 547,
      borderColor: rgb(0.89, 0.87, 0.84),
      borderWidth: 1,
    });

    // Studio Header
    page.drawText('ELEMENT DESIGN • ARCHITECTURAL CORE', {
      x: 35,
      y: 545,
      size: 10,
      font: fontBold,
      color: rgb(0.07, 0.07, 0.07),
    });

    // Title Block
    page.drawRectangle({
      x: 520,
      y: 35,
      width: 290,
      height: 90,
      borderColor: rgb(0.07, 0.07, 0.07),
      borderWidth: 1.5,
    });

    page.drawText(`SHEET: ${sheetCode}`, {
      x: 535,
      y: 100,
      size: 12,
      font: fontBold,
      color: rgb(0.07, 0.07, 0.07),
    });

    page.drawText(title.toUpperCase().slice(0, 32), {
      x: 535,
      y: 80,
      size: 9.5,
      font: fontRegular,
      color: rgb(0.2, 0.2, 0.2),
    });

    page.drawText(`STATUS: ${revNo} [LOCKED FOR CONSTRUCTION]`, {
      x: 535,
      y: 60,
      size: 9,
      font: fontBold,
      color: rgb(0.1, 0.45, 0.2),
    });

    page.drawText(`DATE: ${new Date().toLocaleDateString()} • SCALE: 1:50 @ A1`, {
      x: 535,
      y: 45,
      size: 8,
      font: fontRegular,
      color: rgb(0.4, 0.4, 0.4),
    });

    // Center linework placeholder
    page.drawText('[ ARCHITECTURAL VECTOR CAD DATA COMPILED AT 600 DPI ]', {
      x: 230,
      y: 300,
      size: 12,
      font: fontBold,
      color: rgb(0.5, 0.5, 0.5),
    });

    return await pdfDoc.save();
  },

  /**
   * Generates a superseded PDF stamped diagonally across the sheet
   */
  async generateSupersededPdf(sheetCode: string, title: string, revNo: string): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([842, 595]);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Border
    page.drawRectangle({
      x: 20,
      y: 20,
      width: 802,
      height: 555,
      borderColor: rgb(0.5, 0.5, 0.5),
      borderWidth: 1.5,
    });

    // Big diagonal red watermark
    page.drawText('SUPERSEDED – NOT FOR CONSTRUCTION', {
      x: 90,
      y: 180,
      size: 34,
      font: fontBold,
      color: rgb(0.85, 0.15, 0.15),
      rotate: degrees(30),
      opacity: 0.6,
    });

    page.drawText(`ARCHIVED REVISION: ${sheetCode} • ${revNo}`, {
      x: 160,
      y: 145,
      size: 14,
      font: fontBold,
      color: rgb(0.7, 0.2, 0.2),
      rotate: degrees(30),
      opacity: 0.7,
    });

    // Bottom warning
    page.drawText(`WARNING: THIS DRAWING IS SUPERSEDED. REFER TO ACTIVE SITE RELEASE.`, {
      x: 35,
      y: 35,
      size: 9,
      font: fontBold,
      color: rgb(0.8, 0.1, 0.1),
    });

    return await pdfDoc.save();
  },

  /**
   * Generates a client-stamped copy with dynamic watermarking
   */
  async generateClientStampedPdf(sheetCode: string, title: string, revNo: string, clientName: string): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([842, 595]);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Border
    page.drawRectangle({
      x: 20,
      y: 20,
      width: 802,
      height: 555,
      borderColor: rgb(0.07, 0.07, 0.07),
      borderWidth: 2,
    });

    // Client watermark banner at top
    page.drawRectangle({
      x: 20,
      y: 550,
      width: 802,
      height: 25,
      color: rgb(0.96, 0.94, 0.91),
      borderColor: rgb(0.89, 0.87, 0.84),
      borderWidth: 1,
    });

    const timestamp = new Date().toLocaleString();
    page.drawText(`VERIFIED CLIENT COPY • ISSUED TO: ${clientName.toUpperCase()} • ${timestamp}`, {
      x: 35,
      y: 558,
      size: 8.5,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    });

    // Center CAD data
    page.drawText(`${sheetCode} • ${title.toUpperCase()}`, {
      x: 250,
      y: 310,
      size: 14,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    });

    page.drawText(`ACTIVE SITE RELEASE • ${revNo}`, {
      x: 320,
      y: 285,
      size: 11,
      font: fontBold,
      color: rgb(0.1, 0.45, 0.2),
    });

    return await pdfDoc.save();
  }
};
