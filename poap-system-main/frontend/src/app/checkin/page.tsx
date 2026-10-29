'use client';

import { useState } from 'react';
// Đã xóa import CheckinHeader ở đây
import ScannerPanel from '@/components/checkin/ScannerPanel';
import EventDetailsPanel from '@/components/checkin/EventDetailsPanel';

export default function CheckinPage() {
  const [isScanned, setIsScanned] = useState(false);
  const [mintState, setMintState] = useState<'idle' | 'processing' | 'success'>('idle');

  const handleScanSuccess = () => {
    setIsScanned(true);
    setMintState('idle');
  };

  const handleMintProcess = () => {
    setMintState('processing');
    setTimeout(() => {
      setMintState('success');
    }, 2400);
  };

  return (
    <div className="w-full pt-20 bg-[#0b1326] min-h-screen text-white">
      <div className="flex flex-col w-full bg-[#0b1326]">
        <div className="relative w-full overflow-hidden bg-[#0b1326]">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none"></div>
          <div className="absolute top-1/3 -left-32 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none"></div>
          
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 flex flex-col gap-8 relative z-10">
            {/* Đã xóa <CheckinHeader /> ở đây để ẩn phần hiển thị thẻ sinh viên */}
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-4">
              <ScannerPanel onScanSuccess={handleScanSuccess} />
              <EventDetailsPanel 
                isScanned={isScanned} 
                mintState={mintState} 
                onMint={handleMintProcess} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}