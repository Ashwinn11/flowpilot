"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Mic, MicOff, Sparkles } from "lucide-react";

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTask: (task: any) => void;
}

export function AddTaskModal({ isOpen, onClose, onAddTask }: AddTaskModalProps) {
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("");
  const [priority, setPriority] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [voiceInput, setVoiceInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newTask = {
      title,
      duration: parseInt(duration),
      priority,
      status: "pending",
      scheduled_at: new Date(scheduledTime).toISOString(),
      archetype: "analytical" // TODO: Determine from AI
    };

    onAddTask(newTask);
    
    // Reset form
    setTitle("");
    setDuration("");
    setPriority("");
    setScheduledTime("");
    setVoiceInput("");
  };

  const handleVoiceInput = () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      // TODO: Process voice input with AI
      setTitle("Process voice input with AI");
      setDuration("60");
      setPriority("medium");
    } else {
      // Start recording
      setIsRecording(true);
      // TODO: Start voice recognition
    }
  };

  const handleAIProcess = () => {
    // TODO: Process voice input with OpenAI
    if (voiceInput.trim()) {
      // Mock AI response
      setTitle("Prepare presentation slides");
      setDuration("90");
      setPriority("high");
      setScheduledTime("2024-01-15T14:00");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Voice Input Section */}
          <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Voice Input</Label>
              <Button
                type="button"
                variant={isRecording ? "destructive" : "outline"}
                size="sm"
                onClick={handleVoiceInput}
              >
                {isRecording ? <MicOff className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
                {isRecording ? "Stop Recording" : "Start Recording"}
              </Button>
            </div>
            
            <Textarea
              placeholder="Or type your task description here..."
              value={voiceInput}
              onChange={(e) => setVoiceInput(e.target.value)}
              className="min-h-[80px]"
            />
            
            {voiceInput && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAIProcess}
                className="w-full"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Process with AI
              </Button>
            )}
          </div>

          {/* Manual Input Section */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Task Title</Label>
              <Input
                id="title"
                placeholder="What needs to be done?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  placeholder="60"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduled">Scheduled Time</Label>
              <Input
                id="scheduled"
                type="datetime-local"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white">
              Add Task
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}