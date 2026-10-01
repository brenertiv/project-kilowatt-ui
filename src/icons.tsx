import type { ComponentType } from 'react';
import type { SvgIconProps } from '@mui/material/SvgIcon';
import AddOutlined from '@mui/icons-material/AddOutlined';
import ArrowOutwardOutlined from '@mui/icons-material/ArrowOutwardOutlined';
import CheckOutlined from '@mui/icons-material/CheckOutlined';
import CloseOutlined from '@mui/icons-material/CloseOutlined';
import ContentCopyOutlined from '@mui/icons-material/ContentCopyOutlined';
import ExpandMoreOutlined from '@mui/icons-material/ExpandMoreOutlined';
import RemoveOutlined from '@mui/icons-material/RemoveOutlined';
import DeleteOutlined from '@mui/icons-material/DeleteOutlined';
import RestartAltOutlined from '@mui/icons-material/RestartAltOutlined';
import SaveOutlined from '@mui/icons-material/SaveOutlined';
import SearchOutlined from '@mui/icons-material/SearchOutlined';
import TuneOutlined from '@mui/icons-material/TuneOutlined';
import TrendingUpOutlined from '@mui/icons-material/TrendingUpOutlined';
import WarningAmberOutlined from '@mui/icons-material/WarningAmberOutlined';
import UnfoldMoreOutlined from '@mui/icons-material/UnfoldMoreOutlined';

type IconProps = SvgIconProps;

function uiIcon(className?: string) {
  return ['ui-icon', className].filter(Boolean).join(' ');
}

export function CheckIcon({ className, ...props }: IconProps) {
  return <CheckOutlined className={uiIcon(className)} fontSize="inherit" {...props} />;
}

export function ChevronDownIcon({ className, ...props }: IconProps) {
  return <ExpandMoreOutlined className={uiIcon(className)} fontSize="inherit" {...props} />;
}

export function ChevronUpDownIcon({ className, ...props }: IconProps) {
  return <UnfoldMoreOutlined className={uiIcon(className)} fontSize="inherit" {...props} />;
}

export function PlusIcon({ className, ...props }: IconProps) {
  return <AddOutlined className={uiIcon(className)} fontSize="inherit" {...props} />;
}

export function MinusIcon({ className, ...props }: IconProps) {
  return <RemoveOutlined className={uiIcon(className)} fontSize="inherit" {...props} />;
}

export function XIcon({ className, ...props }: IconProps) {
  return <CloseOutlined className={uiIcon(className)} fontSize="inherit" {...props} />;
}

export function SearchIcon({ className, ...props }: IconProps) {
  return <SearchOutlined className={uiIcon(className)} fontSize="inherit" {...props} />;
}

export function CopyIcon({ className, ...props }: IconProps) {
  return <ContentCopyOutlined className={uiIcon(className)} fontSize="inherit" {...props} />;
}

export function ResetIcon({ className, ...props }: IconProps) {
  return <RestartAltOutlined className={uiIcon(className)} fontSize="inherit" {...props} />;
}

export function SaveIcon({ className, ...props }: IconProps) {
  return <SaveOutlined className={uiIcon(className)} fontSize="inherit" {...props} />;
}

export function DeleteIcon({ className, ...props }: IconProps) {
  return <DeleteOutlined className={uiIcon(className)} fontSize="inherit" {...props} />;
}

export function TrendUpIcon({ className, ...props }: IconProps) {
  return <TrendingUpOutlined className={uiIcon(className)} fontSize="inherit" {...props} />;
}

export function WarningIcon({ className, ...props }: IconProps) {
  return <WarningAmberOutlined className={uiIcon(className)} fontSize="inherit" {...props} />;
}

export function ArrowOutwardIcon({ className, ...props }: IconProps) {
  return <ArrowOutwardOutlined className={uiIcon(className)} fontSize="inherit" {...props} />;
}

export function TuneIcon({ className, ...props }: IconProps) {
  return <TuneOutlined className={uiIcon(className)} fontSize="inherit" {...props} />;
}

export const iconCatalog: { name: string; Icon: ComponentType<IconProps> }[] = [
  { name: 'CheckIcon', Icon: CheckIcon },
  { name: 'ChevronDownIcon', Icon: ChevronDownIcon },
  { name: 'ChevronUpDownIcon', Icon: ChevronUpDownIcon },
  { name: 'PlusIcon', Icon: PlusIcon },
  { name: 'MinusIcon', Icon: MinusIcon },
  { name: 'XIcon', Icon: XIcon },
  { name: 'SearchIcon', Icon: SearchIcon },
  { name: 'CopyIcon', Icon: CopyIcon },
  { name: 'ResetIcon', Icon: ResetIcon },
  { name: 'SaveIcon', Icon: SaveIcon },
  { name: 'DeleteIcon', Icon: DeleteIcon },
  { name: 'TrendUpIcon', Icon: TrendUpIcon },
  { name: 'WarningIcon', Icon: WarningIcon },
  { name: 'ArrowOutwardIcon', Icon: ArrowOutwardIcon },
  { name: 'TuneIcon', Icon: TuneIcon },
];
