import React, { useState } from 'react';
import { Certificate, CertificateTemplate } from '../types';
import { Award, Printer, Copy, Check, X, ShieldCheck, CheckCircle2, Sparkles, Trash2, Image as ImageIcon } from 'lucide-react';

interface CertificateModalProps {
  certificate: Certificate;
  isOpen: boolean;
  onClose: () => void;
  canDelete?: boolean;
  onDelete?: (certId: string) => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({ certificate, isOpen, onClose, canDelete, onDelete }) => {
  const [copied, setCopied] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    const fakeVerificationUrl = `${window.location.origin}/verify/${certificate.credentialId}`;
    navigator.clipboard.writeText(fakeVerificationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Resolve template settings with safe defaults
  const tmpl: CertificateTemplate = certificate.certificateTemplate || {
    templateType: 'preset',
    presetId: 'royal_gold',
    documentTitleTh: 'ใบประกาศนียบัตรจบหลักสูตร',
    documentTitleEn: 'Certificate of Competence & Professional Mastery',
    organizationName: 'ศูนย์ส่งเสริมการเรียนรู้ระดับอำเภอบ้านบึง',
    organizationSubtitle: 'BB FlexLearn — แพลตฟอร์มคอร์สเรียนออนไลน์',
    signatureType: 'text',
    signerName: certificate.instructorName,
    signerTitle: certificate.instructorTitle,
    sealStyle: 'gold'
  };

  const docTitleTh = tmpl.documentTitleTh || 'ใบประกาศนียบัตรจบหลักสูตร';
  const docTitleEn = tmpl.documentTitleEn || 'Certificate of Completion';
  const orgName = tmpl.organizationName || 'ศูนย์ส่งเสริมการเรียนรู้ระดับอำเภอบ้านบึง';
  const orgSubtitle = tmpl.organizationSubtitle || 'BB FlexLearn — แพลตฟอร์มคอร์สเรียนออนไลน์';
  const signerName = tmpl.signerName || certificate.instructorName;
  const signerTitle = tmpl.signerTitle || certificate.instructorTitle;
  const isCustomUpload = tmpl.templateType === 'custom_upload' && !!tmpl.customBackgroundUrl;
  const presetTheme = tmpl.presetId || 'royal_gold';
  const showSeal = tmpl.showSeal !== false;

  // Helper for rendering luxury official seals
  const renderSeal = (style: 'gold' | 'silver' | 'emerald' | 'tech') => {
    if (style === 'silver') {
      return (
        <div className="w-18 h-18 sm:w-22 sm:h-22 rounded-full border-4 border-slate-300 bg-gradient-to-tr from-slate-400 via-slate-100 to-slate-200 p-1 flex items-center justify-center shadow-xl relative">
          <div className="w-full h-full rounded-full border border-dashed border-slate-600 flex flex-col items-center justify-center text-slate-800 font-serif text-[8px] sm:text-[9px] font-bold text-center leading-tight">
            <span className="tracking-widest">OFFICIAL</span>
            <span className="text-lg sm:text-xl my-0.5 text-slate-600">★</span>
            <span className="tracking-widest">VERIFIED</span>
          </div>
        </div>
      );
    }

    if (style === 'emerald') {
      return (
        <div className="w-18 h-18 sm:w-22 sm:h-22 rounded-full border-4 border-emerald-400 bg-gradient-to-tr from-emerald-600 via-emerald-200 to-teal-100 p-1 flex items-center justify-center shadow-xl relative">
          <div className="w-full h-full rounded-full border border-dashed border-emerald-900/60 flex flex-col items-center justify-center text-emerald-950 font-serif text-[8px] sm:text-[9px] font-bold text-center leading-tight">
            <span className="tracking-widest">ACADEMIC</span>
            <span className="text-lg sm:text-xl my-0.5 text-emerald-700">★</span>
            <span className="tracking-widest">HONORS</span>
          </div>
        </div>
      );
    }

    if (style === 'tech') {
      return (
        <div className="w-18 h-18 sm:w-22 sm:h-22 rounded-full border-4 border-cyan-400 bg-gradient-to-tr from-indigo-700 via-cyan-500 to-sky-300 p-1 flex items-center justify-center shadow-xl shadow-cyan-500/20 relative">
          <div className="w-full h-full rounded-full border border-dashed border-cyan-900 flex flex-col items-center justify-center text-slate-950 font-mono text-[8px] sm:text-[9px] font-bold text-center leading-tight">
            <span className="tracking-widest">DIGITAL</span>
            <span className="text-lg sm:text-xl my-0.5 text-cyan-900">◆</span>
            <span className="tracking-widest">AUTHENTIC</span>
          </div>
        </div>
      );
    }

    // Default Gold
    return (
      <div className="w-18 h-18 sm:w-22 sm:h-22 rounded-full border-4 border-amber-500 bg-gradient-to-tr from-amber-600 via-amber-300 to-amber-100 p-1 flex items-center justify-center shadow-xl relative">
        <div className="w-full h-full rounded-full border border-dashed border-amber-900/60 flex flex-col items-center justify-center text-amber-950 font-serif text-[8px] sm:text-[9px] font-bold text-center leading-tight">
          <span className="tracking-widest">OFFICIAL</span>
          <span className="text-lg sm:text-xl my-0.5 text-amber-800">★</span>
          <span className="tracking-widest">CERTIFIED</span>
        </div>
      </div>
    );
  };

  // Helper for rendering signature block
  const renderSignature = (isDarkTheme: boolean) => {
    if (tmpl.signatureType === 'image' && tmpl.signatureImageUrl) {
      return (
        <div className="flex flex-col items-end">
          <div className="h-12 flex items-end justify-end mb-1">
            <img
              src={tmpl.signatureImageUrl}
              alt="ลายมือชื่ออาจารย์"
              className="max-h-12 max-w-[170px] object-contain drop-shadow-sm"
            />
          </div>
          <div className={`w-40 h-px ${isDarkTheme ? 'bg-cyan-500/50' : 'bg-slate-400'} ml-auto`} />
          <p className={`font-bold mt-1 ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{signerName}</p>
          <p className={`text-[10px] ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>{signerTitle}</p>
        </div>
      );
    }

    return (
      <div className="text-right text-xs space-y-1">
        <div
          className={`font-serif italic text-lg sm:text-2xl -mb-1 font-['Playfair_Display',serif] ${
            isDarkTheme ? 'text-cyan-300' : 'text-slate-800'
          }`}
        >
          {signerName}
        </div>
        <div className={`w-40 h-px ${isDarkTheme ? 'bg-cyan-500/50' : 'bg-slate-400'} ml-auto`} />
        <p className={`font-bold ${isDarkTheme ? 'text-white' : 'text-slate-900'}`}>{signerName}</p>
        <p className={`text-[10px] ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>{signerTitle}</p>
      </div>
    );
  };

  // Theme styling rules
  const isDark = !isCustomUpload && presetTheme === 'modern_tech';

  let containerStyles = 'bg-white border-[12px] border-double border-amber-600/40 text-slate-900';
  let containerBgInline: React.CSSProperties = {
    backgroundImage: 'radial-gradient(circle at center, #ffffff 0%, #fefcf6 100%)',
    boxShadow: '0 25px 50px -12px rgba(180, 83, 9, 0.15)'
  };

  if (isCustomUpload) {
    containerStyles = 'bg-slate-950 border-4 border-slate-300 shadow-2xl relative text-slate-900';
    containerBgInline = {
      backgroundImage: `url(${tmpl.customBackgroundUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    };
  } else if (presetTheme === 'modern_tech') {
    containerStyles = 'bg-slate-950 border-4 border-cyan-500/60 shadow-2xl text-slate-100 shadow-[0_0_50px_rgba(6,182,212,0.15)]';
    containerBgInline = {
      backgroundImage: 'radial-gradient(circle at top right, #0f172a 0%, #020617 100%)'
    };
  } else if (presetTheme === 'emerald_academic') {
    containerStyles = 'bg-white border-[10px] border-double border-emerald-700/60 shadow-2xl text-slate-900';
    containerBgInline = {
      backgroundImage: 'radial-gradient(circle at center, #ffffff 0%, #f0fdf4 100%)',
      boxShadow: '0 25px 50px -12px rgba(16, 185, 129, 0.15)'
    };
  } else if (presetTheme === 'minimal_executive') {
    containerStyles = 'bg-white border-2 border-slate-800 shadow-2xl text-slate-900';
    containerBgInline = {
      backgroundImage: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
      boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.1)'
    };
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 no-print">
      <div className="relative m-auto w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
        
        {/* Modal Top Control Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 bg-slate-50/90 backdrop-blur-sm">
          <div className="flex items-center gap-2.5 text-slate-900 font-bold text-sm">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span>{docTitleTh} (Official Certificate)</span>
              <span className="text-[10px] text-slate-500 font-normal">
                {isCustomUpload ? '🎨 เทมเพลตกำหนดเองโดยครูผู้สอน' : `✨ ดีไซน์ธีม: ${presetTheme}`}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-800 bg-white border border-slate-200 hover:bg-slate-100 hover:border-slate-300 transition-all shadow-sm active:scale-95"
              title="พิมพ์หรือบันทึกเป็นไฟล์ PDF"
            >
              <Printer className="w-4 h-4 text-indigo-600" />
              <span>พิมพ์ / บันทึก PDF</span>
            </button>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-800 bg-white border border-slate-200 hover:bg-slate-100 hover:border-slate-300 transition-all shadow-sm active:scale-95"
              title="คัดลอกลิงก์ตรวจสอบความถูกต้อง"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
              <span>{copied ? 'คัดลอกลิงก์แล้ว!' : 'คัดลอกลิงก์ตรวจสอบ'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors ml-1"
              aria-label="ปิดหน้าต่าง"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Printable Area */}
        <div className="p-4 sm:p-10 bg-slate-100/70 overflow-x-auto flex justify-center">
          <div
            id="certificate-print-area"
            className={`w-full max-w-[850px] aspect-[1.414/1] p-6 sm:p-10 relative flex flex-col justify-between text-center select-none overflow-hidden ${containerStyles}`}
            style={containerBgInline}
          >
            {/* Custom Background Scrim Overlay if custom upload is used */}
            {isCustomUpload && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] pointer-events-none" />
            )}

            {/* Corner Ornaments for Classic Gold & Emerald Themes */}
            {presetTheme === 'royal_gold' && !isCustomUpload && (
              <>
                <div className="absolute top-3 left-3 w-14 h-14 border-t-2 border-l-2 border-amber-700/70">
                  <div className="w-2 h-2 bg-amber-600 rounded-full absolute -top-1 -left-1" />
                </div>
                <div className="absolute top-3 right-3 w-14 h-14 border-t-2 border-r-2 border-amber-700/70">
                  <div className="w-2 h-2 bg-amber-600 rounded-full absolute -top-1 -right-1" />
                </div>
                <div className="absolute bottom-3 left-3 w-14 h-14 border-b-2 border-l-2 border-amber-700/70">
                  <div className="w-2 h-2 bg-amber-600 rounded-full absolute -bottom-1 -left-1" />
                </div>
                <div className="absolute bottom-3 right-3 w-14 h-14 border-b-2 border-r-2 border-amber-700/70">
                  <div className="w-2 h-2 bg-amber-600 rounded-full absolute -bottom-1 -right-1" />
                </div>
                <div className="absolute inset-3 border border-amber-600/25 pointer-events-none" />
              </>
            )}

            {presetTheme === 'emerald_academic' && !isCustomUpload && (
              <>
                <div className="absolute top-3 left-3 w-14 h-14 border-t-2 border-l-2 border-emerald-700/70">
                  <div className="w-2 h-2 bg-emerald-600 rounded-full absolute -top-1 -left-1" />
                </div>
                <div className="absolute top-3 right-3 w-14 h-14 border-t-2 border-r-2 border-emerald-700/70">
                  <div className="w-2 h-2 bg-emerald-600 rounded-full absolute -top-1 -right-1" />
                </div>
                <div className="absolute bottom-3 left-3 w-14 h-14 border-b-2 border-l-2 border-emerald-700/70">
                  <div className="w-2 h-2 bg-emerald-600 rounded-full absolute -bottom-1 -left-1" />
                </div>
                <div className="absolute bottom-3 right-3 w-14 h-14 border-b-2 border-r-2 border-emerald-700/70">
                  <div className="w-2 h-2 bg-emerald-600 rounded-full absolute -bottom-1 -right-1" />
                </div>
                <div className="absolute inset-3 border border-emerald-600/20 pointer-events-none" />
              </>
            )}

            {presetTheme === 'modern_tech' && !isCustomUpload && (
              <>
                <div className="absolute inset-2 border border-cyan-500/20 pointer-events-none" />
                <div className="absolute top-2 left-2 w-8 h-8 border-t border-l border-cyan-400" />
                <div className="absolute top-2 right-2 w-8 h-8 border-t border-r border-cyan-400" />
                <div className="absolute bottom-2 left-2 w-8 h-8 border-b border-l border-cyan-400" />
                <div className="absolute bottom-2 right-2 w-8 h-8 border-b border-r border-cyan-400" />
              </>
            )}

            {presetTheme === 'minimal_executive' && !isCustomUpload && (
              <div className="absolute inset-3 border border-slate-300 pointer-events-none" />
            )}

            {/* Inner Content Layer with z-index to stay above scrim */}
            <div className="relative z-10 flex flex-col justify-between h-full">
              
              {/* Header / Institution branding */}
              <div className="pt-1">
                <div className="flex items-center justify-center gap-2.5 mb-1.5">
                  {tmpl.customLogoUrl ? (
                    <img
                      src={tmpl.customLogoUrl}
                      alt="Logo"
                      className="w-10 h-10 object-contain rounded-lg drop-shadow-sm"
                    />
                  ) : (
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-sm tracking-wider shadow-md border ${
                        isDark
                          ? 'bg-cyan-950 text-cyan-400 border-cyan-400/40'
                          : 'bg-slate-900 text-amber-400 border-amber-400/40'
                      }`}
                    >
                      BB
                    </div>
                  )}
                  <span
                    className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                      isDark ? 'text-white' : 'text-slate-900'
                    } font-serif`}
                  >
                    {orgName}
                  </span>
                </div>
                <p
                  className={`text-xs uppercase tracking-[0.2em] font-semibold ${
                    isDark ? 'text-cyan-400' : presetTheme === 'emerald_academic' ? 'text-emerald-800' : 'text-amber-800'
                  }`}
                >
                  {orgSubtitle}
                </p>
                <div
                  className={`w-32 h-0.5 mx-auto mt-2 ${
                    isDark
                      ? 'bg-gradient-to-r from-transparent via-cyan-400 to-transparent'
                      : presetTheme === 'emerald_academic'
                      ? 'bg-gradient-to-r from-transparent via-emerald-600/70 to-transparent'
                      : 'bg-gradient-to-r from-transparent via-amber-600/70 to-transparent'
                  }`}
                />
              </div>

              {/* Certificate Title */}
              <div className="my-1.5">
                <h1
                  className={`text-2xl sm:text-4xl font-serif font-bold tracking-wide ${
                    isDark ? 'text-cyan-300' : presetTheme === 'emerald_academic' ? 'text-emerald-950' : 'text-slate-900'
                  }`}
                >
                  {docTitleTh}
                </h1>
                <p
                  className={`text-xs sm:text-sm italic mt-0.5 font-serif ${
                    isDark ? 'text-slate-400' : presetTheme === 'emerald_academic' ? 'text-emerald-900/80' : 'text-amber-900/80'
                  }`}
                >
                  {docTitleEn}
                </p>
              </div>

              {/* Recipient Details */}
              <div className="my-1 space-y-1.5">
                <p className={`text-xs sm:text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  ขอมอบเอกสารฉบับนี้ไว้เพื่อแสดงว่า
                </p>
                <h2
                  className={`text-2xl sm:text-4xl font-extrabold tracking-wide underline decoration-2 underline-offset-8 ${
                    isDark
                      ? 'text-white decoration-cyan-400/60'
                      : presetTheme === 'emerald_academic'
                      ? 'text-emerald-950 decoration-emerald-500/50'
                      : 'text-slate-900 decoration-amber-500/50'
                  }`}
                >
                  {certificate.userName}
                </h2>
                <p className={`text-xs sm:text-sm pt-2.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  ได้สำเร็จการศึกษาครบถ้วนทุกบทเรียน และผ่านเกณฑ์การประเมินด้วยผลคะแนน{' '}
                  <span className={`font-bold font-mono text-base ${isDark ? 'text-cyan-300' : 'text-slate-900'}`}>
                    {certificate.scorePercentage}%
                  </span>{' '}
                  ในหลักสูตร
                </p>
                <h3
                  className={`text-lg sm:text-2xl font-bold px-4 font-sans ${
                    isDark ? 'text-cyan-100' : 'text-indigo-950'
                  }`}
                >
                  "{certificate.courseTitle}"
                </h3>
              </div>

              {/* Footer Signatures, Verification & Official Seal */}
              <div
                className={`pt-3 border-t grid items-end gap-2 text-left ${showSeal ? 'grid-cols-3' : 'grid-cols-2'} ${
                  isDark ? 'border-cyan-900/60' : 'border-slate-200/90'
                }`}
              >
                {/* Left: Credential and Date */}
                <div className={`text-xs space-y-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  <p>
                    <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>วันที่ออกเอกสาร:</span>{' '}
                    <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      {certificate.issuedDate}
                    </span>
                  </p>
                  <p className="font-mono text-[11px]">
                    <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>รหัสตรวจสอบ:</span>{' '}
                    <span className={`font-bold ${isDark ? 'text-cyan-300' : 'text-indigo-900'}`}>
                      {certificate.credentialId}
                    </span>
                  </p>
                  <div
                    className={`flex items-center gap-1 text-[10px] font-semibold pt-0.5 ${
                      isDark ? 'text-emerald-400' : 'text-emerald-700'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">รับรองลายมือชื่อดิจิทัลและบันทึกในระบบแล้ว</span>
                  </div>
                </div>

                {/* Center: Luxury Official Seal */}
                <div className={showSeal ? 'flex flex-col items-center justify-center' : 'hidden'}>
                  {renderSeal(tmpl.sealStyle || (isDark ? 'tech' : presetTheme === 'emerald_academic' ? 'emerald' : 'gold'))}
                </div>

                {/* Right: Signature */}
                <div>
                  {renderSignature(isDark)}
                </div>
              </div>

            </div>
          </div>
        </div>

        {canDelete && confirmingDelete && (
          <div className="px-6 py-3 bg-rose-50 border-t border-rose-200 flex flex-wrap items-center gap-2 text-xs no-print">
            <span className="font-bold text-rose-800">ยืนยันลบใบประกาศนียบัตรนี้? การกระทำนี้ย้อนกลับไม่ได้</span>
            <span className="ml-auto flex items-center gap-2">
              <button onClick={() => setConfirmingDelete(false)} className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold hover:bg-slate-100 transition-colors">ยกเลิก</button>
              <button onClick={() => { onDelete?.(certificate.id); setConfirmingDelete(false); onClose(); }} className="px-4 py-2 rounded-xl bg-rose-600 text-white font-semibold hover:bg-rose-700 transition-colors shadow-sm">ยืนยันลบ</button>
            </span>
          </div>
        )}
        {/* Modal Bottom Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>ใบประกาศนียบัตรนี้ออกโดยระบบอัตโนมัติ มีผลสมบูรณ์และสามารถอ้างอิงในการทำงานจริงได้</span>
          </div>
            {canDelete && !confirmingDelete && (
              <button
                onClick={() => setConfirmingDelete(true)}
                className="px-5 py-2.5 bg-white text-rose-700 border border-rose-200 rounded-xl hover:bg-rose-50 transition-colors font-semibold shadow-sm flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                ลบใบประกาศฯ
              </button>
            )}
            <button
              onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors font-semibold ml-auto shadow-sm"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
};
