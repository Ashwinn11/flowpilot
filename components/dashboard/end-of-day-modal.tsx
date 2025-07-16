"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { Moon, Star, CheckCircle, X } from "lucide-react";

interface EndOfDayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: {
    productivityRating: number;
    completedBigThing: boolean;
    notes: string;
  }) => void;
}

export function EndOfDayModal({ isOpen, onClose, onSubmit }: EndOfDayModalProps) {
  const [productivityRating, setProductivityRating] = useState<string>("3");
  const [completedBigThing, setCompletedBigThing] = useState<boolean | null>(null);
  const [notes, setNotes] = useState("");

  const handleSubmit = () => {
    if (completedBigThing === null) return;
    
    onSubmit({
      productivityRating: parseInt(productivityRating),
      completedBigThing,
      notes
    });
    
    // Reset form
    setProductivityRating("3");
    setCompletedBigThing(null);
    setNotes("");
  };

  const ratingLabels = {
    "1": "Struggled",
    "2": "Below Average",
    "3": "Average",
    "4": "Good",
    "5": "Excellent"
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="mx-auto w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mb-4"
          >
            <Moon className="w-8 h-8 text-white" />
          </motion.div>
          <DialogTitle className="text-center text-2xl">
            How was your day?
          </DialogTitle>
          <p className="text-center text-muted-foreground">
            Help us learn your patterns to make tomorrow even better
          </p>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Productivity Rating */}
          <div className="space-y-3">
            <Label className="text-base font-medium">How productive did you feel today?</Label>
            <RadioGroup
              value={productivityRating}
              onValueChange={setProductivityRating}
              className="flex justify-between"
            >
              {[1, 2, 3, 4, 5].map((rating) => (
                <motion.div
                  key={rating}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex flex-col items-center space-y-2"
                >
                  <RadioGroupItem
                    value={rating.toString()}
                    id={`rating-${rating}`}
                    className="w-6 h-6"
                  />
                  <div className="flex flex-col items-center">
                    <div className="flex">
                      {Array.from({ length: rating }, (_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            productivityRating === rating.toString()
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-slate-300"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground mt-1">
                      {ratingLabels[rating.toString() as keyof typeof ratingLabels]}
                    </span>
                  </div>
                </motion.div>
              ))}
            </RadioGroup>
          </div>

          {/* Big Thing Completion */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Did you finish your One Big Thing today?</Label>
            <div className="grid grid-cols-2 gap-3">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Card
                  className={`cursor-pointer transition-all duration-200 ${
                    completedBigThing === true
                      ? "ring-2 ring-green-500 bg-green-50 dark:bg-green-900/20"
                      : "hover:shadow-md"
                  }`}
                  onClick={() => setCompletedBigThing(true)}
                >
                  <CardContent className="p-4 text-center">
                    <CheckCircle className={`w-8 h-8 mx-auto mb-2 ${
                      completedBigThing === true ? "text-green-600" : "text-slate-400"
                    }`} />
                    <p className="font-medium">Yes, I did it!</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Card
                  className={`cursor-pointer transition-all duration-200 ${
                    completedBigThing === false
                      ? "ring-2 ring-orange-500 bg-orange-50 dark:bg-orange-900/20"
                      : "hover:shadow-md"
                  }`}
                  onClick={() => setCompletedBigThing(false)}
                >
                  <CardContent className="p-4 text-center">
                    <X className={`w-8 h-8 mx-auto mb-2 ${
                      completedBigThing === false ? "text-orange-600" : "text-slate-400"
                    }`} />
                    <p className="font-medium">Not quite</p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-3">
            <Label htmlFor="notes" className="text-base font-medium">
              Any thoughts about today? (Optional)
            </Label>
            <Textarea
              id="notes"
              placeholder="What went well? What could be improved tomorrow?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[80px] resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Skip
          </Button>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={handleSubmit}
              disabled={completedBigThing === null}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
            >
              Complete Day
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}