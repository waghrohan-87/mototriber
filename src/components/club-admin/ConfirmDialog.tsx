import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
}

const ConfirmDialog = ({ open, onOpenChange, title, description, confirmLabel = "Confirm", onConfirm }: ConfirmDialogProps) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent className="w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-[#2A2A2A] bg-[#1A1A1A] text-[#F0F0F0]">
      <AlertDialogHeader>
        <AlertDialogTitle className="text-[#F0F0F0]">{title}</AlertDialogTitle>
        <AlertDialogDescription className="text-[#AAAAAA]">{description}</AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel className="border-[#3A3A3A] bg-transparent text-[#F0F0F0] hover:bg-[#222222] hover:text-[#F0F0F0]">
          Cancel
        </AlertDialogCancel>
        <AlertDialogAction
          onClick={onConfirm}
          className="bg-[#DC2626] text-white hover:bg-[#DC2626]/90"
        >
          {confirmLabel}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export default ConfirmDialog;
