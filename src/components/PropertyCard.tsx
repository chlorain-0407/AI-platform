import React from 'react';
import {
  Building,
  MapPin,
  Sparkles,
  FileText,
  Edit2,
  Trash2,
  Car,
  Layers,
  Calendar,
  DollarSign,
  Globe,
  ExternalLink,
} from 'lucide-react';
import { Property } from '../models/property';
import { formatCurrency, calculateUnitPrice } from '../lib/utils';

interface PropertyCardProps {
  property: Property;
  onAnalyze: (property: Property) => void;
  onMarketing: (property: Property) => void;
  onEdit: (property: Property) => void;
  onDelete: (id: string) => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  onAnalyze,
  onMarketing,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-4 sm:p-5 transition-all shadow-md flex flex-col justify-between group">
      <div>
        {/* Top Community & Price Row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            {property.community && (
              <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 mb-1">
                {property.community}
              </span>
            )}
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug line-clamp-2">
              {property.title}
            </h3>
          </div>

          <div className="text-right shrink-0">
            <div className="text-lg sm:text-xl font-extrabold text-amber-400">
              {formatCurrency(property.price)}
            </div>
            <div className="text-xs text-slate-400 font-medium">
              {calculateUnitPrice(property.price, property.area)}
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-3.5">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{property.address}</span>
        </div>

        {/* Specs Grid */}
        <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 mb-3.5 text-xs">
          <div>
            <div className="text-slate-400 text-[11px]">坪數</div>
            <div className="text-slate-200 font-semibold">{property.area} 坪</div>
          </div>
          <div>
            <div className="text-slate-400 text-[11px]">格局</div>
            <div className="text-slate-200 font-semibold truncate">{property.layout || '未填'}</div>
          </div>
          <div>
            <div className="text-slate-400 text-[11px]">屋齡</div>
            <div className="text-slate-200 font-semibold">{property.building_age || 0} 年</div>
          </div>
        </div>

        {/* Floor & Parking meta */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mb-3">
          {property.floor && (
            <div className="flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>{property.floor}</span>
            </div>
          )}
          {property.parking && (
            <div className="flex items-center gap-1">
              <Car className="w-3.5 h-3.5 text-slate-400" />
              <span className="truncate max-w-[130px]">{property.parking}</span>
            </div>
          )}
        </div>

        {/* Owner reason badge if available */}
        {property.owner_reason && (
          <div className="text-[11px] p-2 rounded-lg bg-slate-800/50 border border-slate-700/40 text-slate-300 line-clamp-1 mb-2.5">
            <span className="text-amber-400 font-semibold">售屋動機：</span>
            {property.owner_reason}
          </div>
        )}

        {/* External website import badge */}
        {property.sourceType === 'website' && (
          <div className="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg bg-indigo-950/60 border border-indigo-800/60 text-indigo-300 mb-2.5">
            <Globe className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="truncate">外部網站：{property.sourceSite || '公開網頁'}</span>
            {property.sourceUrl && (
              <a
                href={property.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="ml-auto text-indigo-400 hover:text-indigo-200"
                title="開啟原始網站"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        )}

        {/* Database ID & Created timestamp */}
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-3">
          <span className="truncate max-w-[170px] bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
            UUID: {property.id}
          </span>
          <span>{new Date(property.created_at).toLocaleDateString('zh-TW')}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onEdit(property)}
            title="編輯案件"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(property.id)}
            title="刪除案件"
            className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onMarketing(property)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white transition-all border border-slate-700"
          >
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            <span>AI 文案</span>
          </button>

          <button
            id={`analyze-btn-${property.id}`}
            onClick={() => onAnalyze(property)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
            <span>AI 案件分析</span>
          </button>
        </div>
      </div>
    </div>
  );
};
