"use client";

import React, { useState, useEffect } from "react";
import { PlusCircle, CheckCircle, BookOpen, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Task } from "@/lib/supabase/database.types";

interface TaskSelectionProps {
  recentTasks: Task[];
  selectedTaskId: string | null;
  customTaskName: string;
  setSelectedTaskId: (id: string | null) => void;
  setCustomTaskName: (name: string) => void;
  setCurrentTask: (task: Task | null) => void;
  disabled?: boolean;
  isLoading?: boolean;
}

const CompactTaskSelection: React.FC<TaskSelectionProps> = ({
  recentTasks,
  selectedTaskId,
  customTaskName,
  setSelectedTaskId,
  setCustomTaskName,
  setCurrentTask,
  disabled = false,
  isLoading = false
}) => {
  const [isNewTaskMode, setIsNewTaskMode] = useState(false);
  const [pendingTasks, setPendingTasks] = useState<Task[]>([]);

  // Filter pending tasks
  useEffect(() => {
    setPendingTasks(recentTasks.filter(task => task.status !== "completed"));
  }, [recentTasks]);

  // Handle task selection
  const handleTaskSelect = (task: Task) => {
    setSelectedTaskId(task.id);
    setCurrentTask(task);
    setCustomTaskName("");
    setIsNewTaskMode(false);
  };

  // Start new task mode
  const startNewTask = () => {
    setSelectedTaskId(null);
    setCurrentTask(null);
    setCustomTaskName("");
    setIsNewTaskMode(true);
  };

  // Handle custom task name input
  const handleTaskNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomTaskName(e.target.value);

    // If we have a task name, make sure we're not pointing to an existing task
    if (e.target.value.trim() && selectedTaskId) {
      setSelectedTaskId(null);
      setCurrentTask(null);
    }
  };

  // Handle input enter key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && customTaskName.trim()) {
      setIsNewTaskMode(false);
    }
  };

  // Get displayed task name
  const displayedTaskName = selectedTaskId
    ? recentTasks.find(t => t.id === selectedTaskId)?.name || "Tarea seleccionada"
    : customTaskName.trim()
      ? customTaskName
      : "Selecciona una tarea";

  // Loading state
  if (isLoading) {
    return <Skeleton className="h-9 w-full" />;
  }

  return (
    <div className="w-full">
      {isNewTaskMode ? (
        <div className="flex space-x-2">
          <Input
            value={customTaskName}
            onChange={handleTaskNameChange}
            onKeyDown={handleKeyDown}
            placeholder="¿En qué estás trabajando?"
            className="bg-[#262638] border-gray-700 text-white placeholder:text-gray-500 h-9"
            autoFocus
            disabled={disabled}
          />
          <Button
            size="sm"
            variant="outline"
            className="border-gray-700 flex-shrink-0"
            onClick={() => setIsNewTaskMode(false)}
            disabled={disabled}
          >
            OK
          </Button>
        </div>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild disabled={disabled}>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-between text-left font-normal border-gray-700 bg-[#262638] overflow-hidden",
                !selectedTaskId && !customTaskName.trim() && "text-gray-400"
              )}
            >
              <span className="flex items-center truncate max-w-[calc(100%-24px)]">
                <BookOpen className="mr-2 h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="truncate">{displayedTaskName}</span>
              </span>
              {disabled ? (
                <Loader2 className="ml-2 h-4 w-4 flex-shrink-0 animate-spin" />
              ) : (
                <PlusCircle className="ml-2 h-4 w-4 flex-shrink-0 opacity-50" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[300px] bg-[#262638] border-gray-700 text-white">
            <div className="p-2">
              <Button
                variant="ghost"
                className="w-full justify-start text-gray-300 hover:text-white hover:bg-gray-700/50"
                onClick={startNewTask}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                <span>Nueva tarea</span>
              </Button>
            </div>

            {pendingTasks.length > 0 && (
              <>
                <DropdownMenuSeparator className="bg-gray-700" />
                <div className="max-h-[200px] overflow-y-auto p-1">
                  {pendingTasks.map((task) => (
                    <DropdownMenuItem
                      key={task.id}
                      className={cn(
                        "cursor-pointer flex items-center justify-between rounded-md hover:bg-gray-700/50",
                        selectedTaskId === task.id && "bg-purple-900/30"
                      )}
                      onClick={() => handleTaskSelect(task)}
                    >
                      <span className="truncate flex-1">{task.name}</span>
                      {selectedTaskId === task.id && (
                        <CheckCircle className="h-4 w-4 text-purple-400 ml-2 flex-shrink-0" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </div>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};

export default CompactTaskSelection;