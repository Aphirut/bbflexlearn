// เอกสารประกอบบทเรียนต้องดาวน์โหลดเป็นไฟล์ PDF เสมอ:
// ลิงก์ไฟล์ในระบบ (/uploads/...) ให้เบราว์เซอร์เซฟไฟล์ตรง ๆ (download + Content-Disposition: attachment)
// ส่วนลิงก์ภายนอกยังเปิดแท็บใหม่ตามปกติ
export const isLocalMaterialUrl = (url: string): boolean => url.startsWith('/');

export const materialDownloadFileName = (title: string): string => {
  const base =
    (title || 'document')
      .trim()
      .replace(/[\\/:*?"<>|]/g, '')
      .slice(0, 120) || 'document';
  return base.toLowerCase().endsWith('.pdf') ? base : `${base}.pdf`;
};

export const materialAttachmentDisposition = (title: string): string => {
  const safe = materialDownloadFileName(title).replace(/"/g, '');
  return `attachment; filename="${safe}"; filename*=UTF-8''${encodeURIComponent(safe)}`;
};
