
export default function Footer() {
  return (
    <footer className="w-full bg-[var(--paper)] border-t border-[var(--line)] py-12 mt-20 text-[var(--muted)] text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="space-y-3 md:col-span-2">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded bg-[var(--ink)] text-white flex items-center justify-center font-bold text-base">
              汉
            </span>
            <span className="font-bold text-lg text-[var(--ink)]">HSK Studio</span>
          </div>
          <p className="max-w-md text-xs leading-relaxed">
            แพลตฟอร์มฝึกภาษาจีนและเตรียมสอบ HSK (ระดับ 1 - 4)
            ออกแบบมาเพื่อผู้เรียนไทยโดยเฉพาะ รวมคำศัพท์พร้อมพินอิน ตัวอย่างประโยค
            บทเรียนไวยากรณ์ ระบบออกเสียง และแบบทดสอบวัดระดับ
          </p>
        </div>

        <div>
          <h4 className="font-bold text-[var(--ink)] text-sm mb-3">เมนูลัด</h4>
          <ul className="space-y-2 text-xs font-semibold">
            <li>
              <a href="/vocabulary" className="hover:text-[var(--ink)] transition-colors">
                บัตรคำ & คลังศัพท์ HSK
              </a>
            </li>
            <li>
              <a href="/lessons" className="hover:text-[var(--ink)] transition-colors">
                บทเรียน & ไวยากรณ์
              </a>
            </li>
            <li>
              <a href="/quiz" className="hover:text-[var(--ink)] transition-colors">
                ศูนย์รวมแบบทดสอบ Quiz
              </a>
            </li>
            <li>
              <a href="/plan" className="hover:text-[var(--ink)] transition-colors">
                แผนอ่าน 25 นาที & ตัวจับเวลา
              </a>
            </li>
            <li>
              <a href="/stats" className="hover:text-[var(--ink)] transition-colors">
                สถิติและความคืบหน้า
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-[var(--ink)] text-sm mb-3">ระดับการเรียน</h4>
          <div className="flex flex-wrap gap-2 text-xs">
            <a
              href="/vocabulary?level=hsk1"
              className="px-2.5 py-1 rounded bg-[#dd4b39]/10 text-[#dd4b39] font-bold hover:bg-[#dd4b39]/20"
            >
              HSK 1 (150 คำ)
            </a>
            <a
              href="/vocabulary?level=hsk2"
              className="px-2.5 py-1 rounded bg-[#f29f05]/10 text-[#c77f00] font-bold hover:bg-[#f29f05]/20"
            >
              HSK 2 (300 คำ)
            </a>
            <a
              href="/vocabulary?level=hsk3"
              className="px-2.5 py-1 rounded bg-[#22806b]/10 text-[#22806b] font-bold hover:bg-[#22806b]/20"
            >
              HSK 3 (600 คำ)
            </a>
            <a
              href="/vocabulary?level=hsk4"
              className="px-2.5 py-1 rounded bg-[#2f6db5]/10 text-[#2f6db5] font-bold hover:bg-[#2f6db5]/20"
            >
              HSK 4 (1200 คำ)
            </a>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pt-6 border-t border-[var(--line)]/60 text-center text-xs">
        <p>© 2026 HSK Studio. พัฒนาขึ้นเพื่อช่วยให้คนไทยเรียนภาษาจีนได้อย่างมั่นใจและมีประสิทธิภาพ</p>
      </div>
    </footer>
  );
}
