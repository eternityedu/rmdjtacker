import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useDisciplineEngine } from '@/hooks/useDisciplineEngine';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  FileText, 
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

interface ReflectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  taskName: string;
  onComplete: (reflectionText: string) => Promise<boolean>;
}

const REFLECTION_PROMPTS: Record<string, string[]> = {
  food_logging: [
    "What did you eat today and why did you make those choices?",
    "How does this meal align with your health goals?",
    "What would you change about today's eating habits?",
  ],
  ai_consultation: [
    "What insight did you gain from today's AI session?",
    "How will you apply what you learned?",
    "What question would you like to explore next?",
  ],
  default: [
    "What did you accomplish and how do you feel about it?",
    "What obstacles did you overcome?",
    "What will you do differently tomorrow?",
  ],
};

const MIN_REFLECTION_LENGTH = 50; // Minimum characters required

export const ReflectionDialog = ({ 
  isOpen, 
  onClose, 
  taskName, 
  onComplete 
}: ReflectionDialogProps) => {
  const { toast } = useToast();
  const [reflectionText, setReflectionText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const prompts = REFLECTION_PROMPTS[taskName] || REFLECTION_PROMPTS.default;
  const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];

  const isValidReflection = (text: string): { valid: boolean; reason?: string } => {
    if (text.length < MIN_REFLECTION_LENGTH) {
      return { 
        valid: false, 
        reason: `Reflection must be at least ${MIN_REFLECTION_LENGTH} characters. Currently: ${text.length}` 
      };
    }

    // Check for low-effort patterns
    const lowEffortPatterns = [
      /^(.)\1+$/, // Repeated single character
      /^(.{1,3})\1{3,}$/, // Repeated short patterns
      /^[a-z]+$/i, // Only letters without spaces (likely random)
      /^[\d\s]+$/, // Only numbers and spaces
    ];

    if (lowEffortPatterns.some(pattern => pattern.test(text.trim()))) {
      return { 
        valid: false, 
        reason: "Please provide a meaningful reflection. Low-effort responses are not accepted." 
      };
    }

    // Check for minimum word count
    const words = text.trim().split(/\s+/);
    if (words.length < 10) {
      return {
        valid: false,
        reason: `Please write at least 10 words. Currently: ${words.length} words.`
      };
    }

    return { valid: true };
  };

  const handleSubmit = async () => {
    const validation = isValidReflection(reflectionText);
    
    if (!validation.valid) {
      setError(validation.reason || 'Invalid reflection');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const success = await onComplete(reflectionText);
      
      if (success) {
        toast({
          title: "Task Completed",
          description: "Your reflection has been recorded. XP awarded.",
        });
        setReflectionText('');
        onClose();
      } else {
        setError("Failed to submit. Your reflection may not meet quality standards.");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setReflectionText('');
    setError(null);
    onClose();
  };

  const characterCount = reflectionText.length;
  const isMinMet = characterCount >= MIN_REFLECTION_LENGTH;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Proof of Work Required
          </DialogTitle>
          <DialogDescription>
            Complete this reflection to validate your task completion. Low-effort responses will be rejected.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Prompt */}
          <div className="p-3 rounded-lg bg-muted">
            <p className="text-sm italic text-muted-foreground">
              "{randomPrompt}"
            </p>
          </div>

          {/* Textarea */}
          <div className="space-y-2">
            <Label htmlFor="reflection">Your Reflection</Label>
            <Textarea
              id="reflection"
              placeholder="Write your honest reflection here..."
              value={reflectionText}
              onChange={(e) => {
                setReflectionText(e.target.value);
                setError(null);
              }}
              className="min-h-[150px] resize-none"
              disabled={isSubmitting}
            />
            
            {/* Character count */}
            <div className="flex items-center justify-between text-xs">
              <span className={isMinMet ? 'text-emerald-500' : 'text-muted-foreground'}>
                {characterCount}/{MIN_REFLECTION_LENGTH} min characters
              </span>
              {isMinMet && (
                <span className="flex items-center gap-1 text-emerald-500">
                  <CheckCircle className="h-3 w-3" />
                  Minimum met
                </span>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertTriangle className="h-4 w-4" />
                {error}
              </div>
            </div>
          )}

          {/* Warning */}
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-start gap-2 text-amber-600 text-xs">
              <AlertTriangle className="h-4 w-4 mt-0.5" />
              <div>
                <p className="font-medium">Quality Check Active</p>
                <p className="text-muted-foreground mt-1">
                  Repetitive, nonsensical, or low-effort responses will be detected and rejected. 
                  This affects your hidden discipline score.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !isMinMet}
            className="gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            Submit Reflection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
