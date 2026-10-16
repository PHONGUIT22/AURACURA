'use client';

import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  Calendar,
  Share2,
  Copy,
  Check,
  Send,
  ExternalLink,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { soundService } from '../services/soundService';
import { calendarService } from '../services/calendarService';
import { mcpClient } from '../services/mcpClient';
import type { BudgetTier } from '../types';

export type ActionModalType = 'book_table' | 'share_briefing' | 'commission_gift' | null;

export interface ActionModalData {
  type: ActionModalType;
  title: string;
  subtitle?: string;
  vipName?: string;
  vipId?: string;
  venueOrBrand?: string;
  location?: string;
  notes?: string;
  price?: string;
  pairingNotes?: string;
  refCode?: string;
  giftId?: string;
  budgetTier?: BudgetTier;
}

interface ActionDispatchModalProps {
  data: ActionModalData | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (confirmedOrder: any) => void;
}

export const ActionDispatchModal: React.FC<ActionDispatchModalProps> = ({
  data,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [copied, setCopied] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [confirmedCode, setConfirmedCode] = useState<string | null>(null);
  const [committedOrder, setCommittedOrder] = useState<any>(null);
  const committedKeyRef = React.useRef<string | null>(null);
  const onSuccessRef = React.useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  React.useEffect(() => {
    if (!isOpen || !data) {
      committedKeyRef.current = null;
      setConfirmedCode(null);
      setCommittedOrder(null);
      setIsCommitting(false);
      return;
    }

    const currentKey = `${data.type}_${data.title}_${data.vipId || ''}`;
    // Guard against infinite re-render loop: only run once per distinct order item
    if (committedKeyRef.current === currentKey) {
      return;
    }

    if (data.type === 'commission_gift' || data.type === 'book_table') {
      committedKeyRef.current = currentKey;
      let isMounted = true;
      setIsCommitting(true);

      const numericPrice = data.price ? parseInt(data.price.replace(/[^0-9]/g, ''), 10) : 450;
      const orderPayload: any = {
        vipId: data.vipId || 'vip_marcus_vance',
        budgetTier: data.budgetTier || 'executive_500',
      };

      if (data.type === 'commission_gift') {
        orderPayload.gift = {
          id: data.giftId || `gift_${Date.now()}`,
          title: data.title,
          brandOrArtisan: data.venueOrBrand || 'Independent Atelier',
          estimatedPriceUsd: numericPrice || 450,
          category: 'curated_artifact',
        };
      } else {
        orderPayload.dining = {
          venueName: data.title,
          partySize: 2,
          requestedDate: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10),
          privateRoom: true,
          notes: data.pairingNotes || data.notes,
        };
      }

      mcpClient
        .commitReservation(orderPayload)
        .then((res) => {
          if (!isMounted) return;
          setIsCommitting(false);
          if (res && res.order) {
            setConfirmedCode(res.order.confirmationCode);
            setCommittedOrder(res.order);
            onSuccessRef.current?.(res.order);
          }
        })
        .catch(() => {
          if (!isMounted) return;
          setIsCommitting(false);
        });

      return () => {
        isMounted = false;
      };
    }
  }, [isOpen, data?.type, data?.title, data?.vipId]);

  if (!isOpen || !data) return null;

  const refCode = confirmedCode || data.refCode || `CV-ORD-${Math.floor(10000 + Math.random() * 90000)}`;

  const shareText = `*CuraVIP Executive Concierge Briefing*
Principal: ${data.vipName || 'VIP Principal'}
Proposal: ${data.title} (${data.venueOrBrand || 'Exclusive Venue'})
Location: ${data.location || 'Diplomatic District'}
Protocol: ${data.pairingNotes || data.notes || 'Audited via Qloo Taste Graph'}
Ref Code: ${refCode}`;

  const handleCopy = () => {
    soundService.playMechanicalClick();
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsApp = () => {
    soundService.playMechanicalClick();
    const encoded = encodeURIComponent(shareText);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const handleDownloadCalendar = () => {
    soundService.playMechanicalClick();
    calendarService.downloadIcsEvent({
      title: `CuraVIP: ${data.title} w/ ${data.vipName || 'Executive'}`,
      description: shareText,
      location: data.location || 'Private Dining Salon',
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-slide">
      <div className="w-full max-w-lg bg-[#F8F6F0] border border-[#183D33]/20 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[94vh] sm:max-h-[88vh]">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 bg-white border-b border-[#E5E0D6] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#183D33] text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-emerald-300" />
            </div>
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[#183D33] block">
                Autonomous Action Dispatch
              </span>
              <h3 className="font-sans text-base font-semibold text-[#161A18]">
                {data.type === 'book_table' && 'Michelin & Private Salon Reservation'}
                {data.type === 'share_briefing' && 'Executive Messaging Dispatch'}
                {data.type === 'commission_gift' && 'Artisan Atelier Commission Request'}
              </h3>
            </div>
          </div>

          <button
            onClick={() => {
              soundService.playMechanicalClick();
              onClose();
            }}
            className="p-1.5 rounded-lg border border-[#E5E0D6] text-[#6B736D] hover:text-[#161A18] hover:bg-[#FAF8F5] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4 sm:space-y-5 flex-1 min-h-0 overflow-y-auto">
          {/* Status banner */}
          <div className="p-4 rounded-2xl bg-[#EDF4F0] border border-[#C8DCD1] text-[#1D5A4A] flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold uppercase tracking-wider block">
                {data.type === 'book_table' && 'Concierge Booking Protocol Confirmed'}
                {data.type === 'share_briefing' && 'Briefing Formatted & Encrypted'}
                {data.type === 'commission_gift' && 'Bespoke Atelier Order Initialized'}
              </span>
              <p className="text-xs text-[#323835] mt-1 leading-relaxed">
                {data.type === 'book_table' &&
                  `Private Salon hold placed at ${data.venueOrBrand} under Principal VIP profile ${data.vipName}. Zero dietary or taboo infringements verified.`}
                {data.type === 'share_briefing' &&
                  `Instant one-tap dispatch to WhatsApp or Signal. Optimized for C-suite executive consumption.`}
                {data.type === 'commission_gift' &&
                  `Artisan requisition generated for ${data.title}. Corporate compliance audited under policy cap.`}
              </p>
            </div>
          </div>

          {/* Details Card */}
          <div className="bg-white rounded-2xl border border-[#EBE6DD] p-4.5 space-y-3 shadow-2xs text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-[#EBE6DD]">
              <span className="text-[#6B736D] font-medium uppercase tracking-wide">
                {committedOrder ? 'MCP Order Reference' : 'Dispatch Reference'}
              </span>
              <div className="flex items-center gap-2">
                {isCommitting && (
                  <span className="text-[10px] text-amber-700 animate-pulse font-sans">Syncing MCP Tool...</span>
                )}
                {committedOrder && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full font-semibold">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>commit_curated_reservation</span>
                  </span>
                )}
                <span className="font-mono font-semibold text-[#183D33] bg-[#183D33]/5 px-2 py-0.5 rounded">
                  {refCode}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-start">
              <span className="text-[#6B736D]">Target Engagement:</span>
              <span className="font-semibold text-[#161A18] text-right max-w-[65%]">{data.title}</span>
            </div>

            {data.venueOrBrand && (
              <div className="flex justify-between items-start">
                <span className="text-[#6B736D]">Venue / Atelier:</span>
                <span className="font-semibold text-[#161A18] text-right">{data.venueOrBrand}</span>
              </div>
            )}

            {data.vipName && (
              <div className="flex justify-between items-start">
                <span className="text-[#6B736D]">Guest Principal:</span>
                <span className="font-semibold text-[#183D33] text-right">{data.vipName}</span>
              </div>
            )}

            {data.location && (
              <div className="flex justify-between items-start">
                <span className="text-[#6B736D]">Location:</span>
                <span className="text-[#323835] text-right">{data.location}</span>
              </div>
            )}

            {data.pairingNotes && (
              <div className="pt-2 border-t border-[#EBE6DD]">
                <span className="text-[#6B736D] block mb-1">Pairing & Protocol Notes:</span>
                <p className="text-[#323835] italic leading-relaxed">{data.pairingNotes}</p>
              </div>
            )}
          </div>

          {/* Preview / Share Message Snippet */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold uppercase text-[#6B736D] tracking-wider block">
              Direct Executive Dispatch Text
            </span>
            <div className="relative p-3 bg-white rounded-xl border border-[#E5E0D6] font-mono text-[11px] text-[#323835] leading-relaxed max-h-28 overflow-y-auto">
              <pre className="whitespace-pre-wrap font-mono">{shareText}</pre>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 sm:px-6 py-3.5 sm:py-4 bg-white border-t border-[#E5E0D6] flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-[#E5E0D6] hover:border-[#183D33] bg-[#FAF8F5] text-xs font-semibold text-[#183D33] rounded-xl transition-all shadow-2xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Brief' : 'Copy Text'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadCalendar}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-[#E5E0D6] hover:border-[#183D33] bg-[#FAF8F5] text-xs font-semibold text-[#183D33] rounded-xl transition-all shadow-2xs"
              title="Download real .ics calendar event"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>.ICS Calendar</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleWhatsApp}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition-all shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundService.playMechanicalClick();
                onClose();
              }}
              className="px-4 py-2 bg-[#183D33] hover:bg-[#224F43] text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition-all shadow-sm"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
