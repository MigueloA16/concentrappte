"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Clock, Info } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";

// Define time management techniques with their default values
const TIME_MANAGEMENT_TECHNIQUES = [
  {
    id: "pomodoro",
    name: "Pomodoro Técnica",
    description: "25 minutos de trabajo seguidos de 5 minutos de descanso",
    focusTime: 25,
    breakLength: 5,
    targetSessions: 4,
  },
  {
    id: "52-17",
    name: "Técnica 52/17",
    description: "52 minutos de trabajo seguidos de 17 minutos de descanso",
    focusTime: 52,
    breakLength: 17,
    targetSessions: 3,
  },
  {
    id: "90-20",
    name: "Ciclo de 90 minutos",
    description: "90 minutos de trabajo seguidos de 20 minutos de descanso",
    focusTime: 90,
    breakLength: 20,
    targetSessions: 2,
  },
  {
    id: "ultradian",
    name: "Ritmo Ultradiano",
    description: "110 minutos de trabajo seguidos de 20 minutos de descanso",
    focusTime: 110,
    breakLength: 20,
    targetSessions: 2,
  },
  {
    id: "50-10",
    name: "Técnica 50/10",
    description: "50 minutos de trabajo seguidos de 10 minutos de descanso",
    focusTime: 50,
    breakLength: 10,
    targetSessions: 4,
  },
  {
    id: "custom",
    name: "Personalizado",
    description: "Define tu propio ritmo de trabajo y descanso",
    focusTime: 30,
    breakLength: 5,
    targetSessions: 4,
  }
];

interface TimerSettingsProps {
  initialSettings?: any; // Or define a more specific type
}


export default function TimerSettings({ initialSettings }: TimerSettingsProps) {
  const [selectedTechniqueId, setSelectedTechniqueId] = useState(TIME_MANAGEMENT_TECHNIQUES[0].id);
  const [focusTime, setFocusTime] = useState(TIME_MANAGEMENT_TECHNIQUES[0].focusTime);
  const [breakLength, setBreakLength] = useState(TIME_MANAGEMENT_TECHNIQUES[0].breakLength);
  const [targetSessions, setTargetSessions] = useState(TIME_MANAGEMENT_TECHNIQUES[0].targetSessions);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load user's saved timer settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true);

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          throw new Error("User not authenticated");
        }

        // If initialSettings is provided, use it instead of fetching
        if (initialSettings) {
          setSelectedTechniqueId(initialSettings.technique_id);
          setFocusTime(initialSettings.focus_time);
          setBreakLength(initialSettings.break_length);
          setTargetSessions(initialSettings.target_sessions);
          setLoading(false);
          return;
        } else {
          // Get user's timer settings
          const { data, error } = await supabase
            .from("timer_settings")
            .select("*")
            .eq("user_id", user.id)
            .single();

          if (error && error.code !== "PGRST116") { // PGRST116 is "no rows returned" error
            throw error;
          }

          // If user has saved settings, use them
          if (data) {
            setSelectedTechniqueId(data.technique_id);
            setFocusTime(data.focus_time);
            setBreakLength(data.break_length);
            setTargetSessions(data.target_sessions);
          }
        }
      } catch (error) {
        console.error("Error loading timer settings:", error);
        // Just use defaults if there's an error
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [initialSettings]);

  // Handle technique change
  const handleTechniqueChange = (techniqueId) => {
    const technique = TIME_MANAGEMENT_TECHNIQUES.find(t => t.id === techniqueId);

    if (technique) {
      setSelectedTechniqueId(techniqueId);

      // Only update values if it's not the custom technique
      if (techniqueId !== "custom") {
        setFocusTime(technique.focusTime);
        setBreakLength(technique.breakLength);
        setTargetSessions(technique.targetSessions);
      }
    }
  };

  // Save settings to Supabase
  const saveSettings = async () => {
    try {
      setSaving(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      // Check if user already has settings
      const { data, error: selectError } = await supabase
        .from("timer_settings")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (selectError && selectError.code !== "PGRST116") {
        throw selectError;
      }

      const settings = {
        user_id: user.id,
        technique_id: selectedTechniqueId,
        focus_time: focusTime,
        break_length: breakLength,
        target_sessions: targetSessions,
        updated_at: new Date().toISOString()
      };

      let error;

      // Update or insert based on whether settings already exist
      if (data?.id) {
        ({ error } = await supabase
          .from("timer_settings")
          .update(settings)
          .eq("id", data.id));
      } else {
        ({ error } = await supabase
          .from("timer_settings")
          .insert({
            ...settings,
            created_at: new Date().toISOString()
          }));
      }

      if (error) throw error;

      toast.success("Configuración guardada exitosamente");
    } catch (error) {
      console.error("Error saving timer settings:", error);
      toast.error("Error al guardar la configuración");
    } finally {
      setSaving(false);
    }
  };

  const selectedTechnique = TIME_MANAGEMENT_TECHNIQUES.find(t => t.id === selectedTechniqueId) || TIME_MANAGEMENT_TECHNIQUES[0];

  return (
    <Card className="w-full bg-[#1a1a2e] border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Clock className="mr-2 h-5 w-5 text-purple-400" />
          Configuración del Temporizador
        </CardTitle>
        <CardDescription className="text-gray-400">
          Personaliza tu sesión de enfoque para maximizar tu productividad
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Time Management Technique Selection */}
        <div className="space-y-2">
          <Label htmlFor="technique" className="text-gray-300">Técnica de gestión del tiempo</Label>
          <Select
            value={selectedTechniqueId}
            onValueChange={handleTechniqueChange}
            disabled={loading}
          >
            <SelectTrigger className="bg-[#262638] border-gray-700 text-white">
              <SelectValue placeholder="Selecciona una técnica" />
            </SelectTrigger>
            <SelectContent className="bg-[#262638] border-gray-700 text-white">
              {TIME_MANAGEMENT_TECHNIQUES.map((technique) => (
                <SelectItem key={technique.id} value={technique.id} className="focus:bg-purple-800 focus:text-white">
                  {technique.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <p className="text-sm text-gray-400 mt-1 flex items-start">
            <Info className="h-4 w-4 mr-1 mt-0.5 text-purple-400 flex-shrink-0" />
            <span>{selectedTechnique.description}</span>
          </p>
        </div>

        {/* Focus Time */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="focusTime" className="text-gray-300">Tiempo de enfoque</Label>
            <span className="text-white font-medium">{focusTime} minutos</span>
          </div>

          <div className="flex items-center space-x-3">
            <Slider
              id="focusTime"
              value={[focusTime]}
              min={5}
              max={120}
              step={5}
              onValueChange={(values) => {
                setFocusTime(values[0]);
                // If manually changing values, switch to custom technique
                if (selectedTechniqueId !== "custom") {
                  setSelectedTechniqueId("custom");
                }
              }}
              disabled={loading}
              className="flex-1"
            />
            <Input
              type="number"
              value={focusTime}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (!isNaN(value) && value > 0) {
                  setFocusTime(value);
                  // If manually changing values, switch to custom technique
                  if (selectedTechniqueId !== "custom") {
                    setSelectedTechniqueId("custom");
                  }
                }
              }}
              min={1}
              max={120}
              className="w-16 bg-[#262638] border-gray-700 text-white"
              disabled={loading}
            />
          </div>
        </div>

        {/* Break Length */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="breakLength" className="text-gray-300">Tiempo de descanso</Label>
            <span className="text-white font-medium">{breakLength} minutos</span>
          </div>

          <div className="flex items-center space-x-3">
            <Slider
              id="breakLength"
              value={[breakLength]}
              min={1}
              max={30}
              step={1}
              onValueChange={(values) => {
                setBreakLength(values[0]);
                // If manually changing values, switch to custom technique
                if (selectedTechniqueId !== "custom") {
                  setSelectedTechniqueId("custom");
                }
              }}
              disabled={loading}
              className="flex-1"
            />
            <Input
              type="number"
              value={breakLength}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (!isNaN(value) && value > 0) {
                  setBreakLength(value);
                  // If manually changing values, switch to custom technique
                  if (selectedTechniqueId !== "custom") {
                    setSelectedTechniqueId("custom");
                  }
                }
              }}
              min={1}
              max={30}
              className="w-16 bg-[#262638] border-gray-700 text-white"
              disabled={loading}
            />
          </div>
        </div>

        {/* Target Sessions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="targetSessions" className="text-gray-300">Sesiones objetivo</Label>
            <span className="text-white font-medium">{targetSessions} sesiones</span>
          </div>

          <div className="flex items-center space-x-3">
            <Slider
              id="targetSessions"
              value={[targetSessions]}
              min={1}
              max={10}
              step={1}
              onValueChange={(values) => {
                setTargetSessions(values[0]);
                // If manually changing values, switch to custom technique
                if (selectedTechniqueId !== "custom") {
                  setSelectedTechniqueId("custom");
                }
              }}
              disabled={loading}
              className="flex-1"
            />
            <Input
              type="number"
              value={targetSessions}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (!isNaN(value) && value > 0) {
                  setTargetSessions(value);
                  // If manually changing values, switch to custom technique
                  if (selectedTechniqueId !== "custom") {
                    setSelectedTechniqueId("custom");
                  }
                }
              }}
              min={1}
              max={10}
              className="w-16 bg-[#262638] border-gray-700 text-white"
              disabled={loading}
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-2">
          <Button
            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            onClick={saveSettings}
            disabled={loading || saving}
          >
            {saving ? "Guardando..." : "Guardar configuración"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}