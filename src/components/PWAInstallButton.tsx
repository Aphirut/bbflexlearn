import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, Share, PlusSquare, X, Check, Laptop } from 'lucide-react';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'header' | 'banner' | 'compact';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'header'
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showDesktopGuide, setShowDesktopGuide] = useState(false);

  // If already running as standalone PWA, hide install affordance
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow with beforeinstallprompt
  if (isInstallable) {
    if (variant === 'compact') {
      return (
        <button
          onClick={install}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors ${className}`}
          title="ติดตั้งแอปพลิเคชันลงบนเครื่องของคุณ"
        >
          <Download className="w-3.5 h-3.5" />
          <span>ติดตั้งแอป</span>
        </button>
      );
    }

    return (
      <button
        onClick={install}
        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-sm hover:shadow transition-all active:scale-95 ${className}`}
        title="ติดตั้ง BB FlexLearn บนอุปกรณ์ของคุณ"
      >
        <Download className="w-4 h-4" />
        <span>ติดตั้งแอป (Install)</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm ${className}`}
          title="วิธีติดตั้งบน iPhone และ iPad"
        >
          <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
          <span>ติดตั้งบน iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
            <div className="w-full m-auto max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4 text-slate-900">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-base font-bold text-slate-900">ติดตั้งบน iPhone / iPad</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                ติดตั้ง BB FlexLearn ไว้บนหน้าจอโฮมเพื่อเข้าเรียนแบบเต็มหน้าจอและใช้งานออฟไลน์ได้เหมือนแอปแท้:
              </p>

              <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <span className="font-semibold text-slate-800">แตะปุ่มแชร์ (Share)</span>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      กดปุ่มสัญลักษณ์สี่เหลี่ยมลูกศรชี้ขึ้น <Share className="w-3.5 h-3.5 inline text-indigo-600 mx-0.5" /> บริเวณแถบล่างของ Safari
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <span className="font-semibold text-slate-800">เลือก "เพิ่มไปยังหน้าจอโฮม"</span>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      เลื่อนลงมาแล้วแตะที่ <PlusSquare className="w-3.5 h-3.5 inline text-indigo-600 mx-0.5" /> <strong>Add to Home Screen</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                    3
                  </span>
                  <div>
                    <span className="font-semibold text-slate-800">แตะ "เพิ่ม" (Add)</span>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      ไอคอนแอปจะปรากฏบนหน้าจอโฮมพร้อมใช้งานทันที
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
              >
                เข้าใจแล้ว ปิดหน้าต่าง
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback desktop browser guide (Chrome/Edge/Brave) when beforeinstallprompt has not fired or already triggered
  return (
    <>
      <button
        onClick={() => setShowDesktopGuide(true)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm ${className}`}
        title="วิธีติดตั้งแอปบนคอมพิวเตอร์และมือถือ"
      >
        <Laptop className="w-3.5 h-3.5 text-indigo-600" />
        <span className="hidden sm:inline">ติดตั้ง PWA</span>
        <span className="sm:hidden">ติดตั้ง</span>
      </button>

      {showDesktopGuide && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="w-full m-auto max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4 text-slate-900">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Laptop className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">วิธีติดตั้ง BB FlexLearn App</h3>
              </div>
              <button
                onClick={() => setShowDesktopGuide(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              คุณสามารถติดตั้งแพลตฟอร์ม BB FlexLearn ไว้บนเครื่องเพื่อเปิดใช้งานเป็น Standalone App รองรับออฟไลน์แคช:
            </p>

            <div className="space-y-2.5 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[11px] shrink-0">
                  1
                </span>
                <p className="text-slate-700">
                  บนเบราว์เซอร์ Chrome / Edge: มองหาไอคอน <strong>ติดตั้ง (Install App)</strong> <Download className="w-3 h-3 inline text-indigo-600 mx-0.5" /> ที่ด้านขวาของแถบ Address Bar
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[11px] shrink-0">
                  2
                </span>
                <p className="text-slate-700">
                  กดปุ่ม <strong>Install</strong> หรือ <strong>เพิ่มลงในหน้าจอหลัก</strong> เพื่อสร้างทางลัดแอป
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[11px] shrink-0">
                  3
                </span>
                <p className="text-slate-700">
                  แอปจะเปิดแยกเป็นหน้าต่างเดี่ยว ไร้แถบ URL ทำงานเร็วและรองรับการใช้งานออฟไลน์
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowDesktopGuide(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}
    </>
  );
};
