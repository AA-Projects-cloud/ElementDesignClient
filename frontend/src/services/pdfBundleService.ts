import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { saveAs } from 'file-saver';
import { drawingsService } from './drawingsService';
import { fileStorageService } from './fileStorageService';

export const pdfBundleService = {
  /**
   * Builds an entire merged architectural bundle PDF with cover page, TOC, and active sheets
   */
  async generateProjectBundlePdf(projectId: string, clientName: string, projectTitle: string): Promise<void> {
    const sheets = await drawingsService.getSheets(projectId);

    const mergedPdf = await PDFDocument.create();
    const fontBold = await mergedPdf.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await mergedPdf.embedFont(StandardFonts.Helvetica);

    // 1. Cover Page
    const coverPage = mergedPdf.addPage([842, 595]);
    coverPage.drawRectangle({
      x: 30,
      y: 30,
      width: 782,
      height: 535,
      borderColor: rgb(0.07, 0.07, 0.07),
      borderWidth: 2,
    });

    coverPage.drawText('ELEMENT DESIGN', {
      x: 60,
      y: 480,
      size: 28,
      font: fontBold,
      color: rgb(0.07, 0.07, 0.07),
    });

    coverPage.drawText('ARCHITECTURAL CORE • LUXURY COMMISSION DOSSIER', {
      x: 60,
      y: 450,
      size: 11,
      font: fontRegular,
      color: rgb(0.43, 0.41, 0.37),
    });

    coverPage.drawText(projectTitle.toUpperCase(), {
      x: 60,
      y: 360,
      size: 32,
      font: fontBold,
      color: rgb(0.07, 0.07, 0.07),
    });

    coverPage.drawText(`CLIENT COMMISSION: ${clientName.toUpperCase()}`, {
      x: 60,
      y: 320,
      size: 14,
      font: fontRegular,
      color: rgb(0.2, 0.2, 0.2),
    });

    coverPage.drawText(`ISSUED: ${new Date().toLocaleDateString()} • COMPLETE TECHNICAL DRAWINGS SET`, {
      x: 60,
      y: 290,
      size: 10,
      font: fontRegular,
      color: rgb(0.4, 0.4, 0.4),
    });

    // 2. Table of Contents
    coverPage.drawText('CONTENTS:', {
      x: 60,
      y: 220,
      size: 12,
      font: fontBold,
      color: rgb(0.07, 0.07, 0.07),
    });

    let yOffset = 195;
    sheets.slice(0, 8).forEach((sheet, idx) => {
      coverPage.drawText(`${idx + 1}. ${sheet.code} — ${sheet.title} (${sheet.currentRev || 'REV 01'})`, {
        x: 60,
        y: yOffset,
        size: 10,
        font: fontRegular,
        color: rgb(0.15, 0.15, 0.15),
      });
      yOffset -= 20;
    });

    // 3. Append every uploaded PDF and image (videos can't be merged into a PDF)
    for (const sheet of sheets) {
      const currentRev = sheet.revisions?.find((r) => r.status === 'current') || sheet.revisions?.[0];
      if (!currentRev?.filePath) continue;
      const blob = await fileStorageService.getBlob(currentRev.filePath);
      if (!blob) continue;
      const bytes = new Uint8Array(await blob.arrayBuffer());

      if (currentRev.mediaType === 'pdf') {
        const singleDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
        const copiedPages = await mergedPdf.copyPages(singleDoc, singleDoc.getPageIndices());
        copiedPages.forEach((p) => mergedPdf.addPage(p));
      } else if (currentRev.mediaType === 'image') {
        const type = blob.type;
        const img = type === 'image/png' ? await mergedPdf.embedPng(bytes) : type === 'image/jpeg' ? await mergedPdf.embedJpg(bytes) : null;
        if (!img) continue;
        const page = mergedPdf.addPage([842, 595]);
        const scale = Math.min(782 / img.width, 535 / img.height, 1);
        page.drawImage(img, { x: 30, y: 30, width: img.width * scale, height: img.height * scale });
      }
    }

    const mergedBytes = await mergedPdf.save();
    const blob = new Blob([mergedBytes as unknown as BlobPart], { type: 'application/pdf' });
    const filename = `${projectTitle.replace(/\s+/g, '_')}_Complete_Bundle_${new Date().toISOString().split('T')[0]}.pdf`;
    saveAs(blob, filename);
  }
};
