import { useState, useEffect, useMemo } from "react";
import { View, StyleSheet, Pressable, TextInput, ScrollView, ActivityIndicator, Platform, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { GalaxyBackground } from "@/components/GalaxyBackground";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";

let DateTimePicker: any = null;
if (Platform.OS !== 'web') {
  DateTimePicker = require("@react-native-community/datetimepicker").default;
}

type DreamTypeOption = "personal" | "challenge" | "group";
type DurationUnit = "days" | "weeks" | "months" | "years";
type Recurrence = "daily" | "weekly" | "semi-weekly" | "monthly" | "semi-monthly";

function getValidRecurrences(durationUnit: DurationUnit): Recurrence[] {
  switch (durationUnit) {
    case "days":
      return ["daily"];
    case "weeks":
      return ["daily", "semi-weekly", "weekly"];
    case "months":
      return ["daily", "semi-weekly", "weekly", "semi-monthly", "monthly"];
    case "years":
      return ["daily", "semi-weekly", "weekly", "semi-monthly", "monthly"];
    default:
      return ["daily"];
  }
}

function getDefaultRecurrence(durationUnit: DurationUnit): Recurrence {
  switch (durationUnit) {
    case "days":
      return "daily";
    case "weeks":
      return "daily";
    case "months":
      return "daily";
    case "years":
      return "daily";
    default:
      return "daily";
  }
}

interface GeneratedTask {
  date: Date;
  text: string;
  order: number;
}

function normalizeToLocalMidnight(date: Date): Date {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
}

function getLastDayOfMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  const originalDay = result.getDate();
  result.setMonth(result.getMonth() + months);
  if (result.getDate() !== originalDay) {
    result.setDate(0);
  }
  return normalizeToLocalMidnight(result);
}

function addYears(date: Date, years: number): Date {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return normalizeToLocalMidnight(result);
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return normalizeToLocalMidnight(result);
}

function calculateEndDate(startDate: Date, duration: number, durationUnit: DurationUnit): Date {
  const start = normalizeToLocalMidnight(startDate);
  switch (durationUnit) {
    case "days": return addDays(start, duration - 1);
    case "weeks": return addDays(start, duration * 7 - 1);
    case "months": return addDays(addMonths(start, duration), -1);
    case "years": return addDays(addYears(start, duration), -1);
    default: return addDays(start, duration - 1);
  }
}

function generateDailyTasks(start: Date, endDate: Date): GeneratedTask[] {
  const tasks: GeneratedTask[] = [];
  // First task = Start Date, then 1 task per day
  let currentDate = normalizeToLocalMidnight(start);
  let order = 0;
  while (currentDate.getTime() <= endDate.getTime() && order < 1000) {
    tasks.push({ date: new Date(currentDate), text: "", order: order++ });
    currentDate = addDays(currentDate, 1);
  }
  return tasks;
}

function generateWeeklyTasks(start: Date, endDate: Date): GeneratedTask[] {
  const tasks: GeneratedTask[] = [];
  // First task = Start Date + 6 days, subsequent tasks every 7 days
  let currentDate = addDays(normalizeToLocalMidnight(start), 6);
  let order = 0;
  while (currentDate.getTime() <= endDate.getTime() && order < 1000) {
    tasks.push({ date: new Date(currentDate), text: "", order: order++ });
    currentDate = addDays(currentDate, 7);
  }
  return tasks;
}

function generateSemiWeeklyTasks(start: Date, endDate: Date): GeneratedTask[] {
  const tasks: GeneratedTask[] = [];
  // First two tasks: Start Date + 3 days, Start Date + 6 days
  // Then repeat the same pattern every week (consistent 3-day / 3-day gap cycle)
  const startNorm = normalizeToLocalMidnight(start);
  let order = 0;
  // Generate tasks in 3-day intervals (twice per week)
  let currentDate = addDays(startNorm, 3);
  while (currentDate.getTime() <= endDate.getTime() && order < 1000) {
    tasks.push({ date: new Date(currentDate), text: "", order: order++ });
    currentDate = addDays(currentDate, 3);
  }
  return tasks;
}

function generateMonthlyTasks(start: Date, endDate: Date): GeneratedTask[] {
  const tasks: GeneratedTask[] = [];
  // First task = Start Date + 29 days, every next task = +30 days
  // Clamp to last valid date if month is shorter, leap-year safe
  let currentDate = addDays(normalizeToLocalMidnight(start), 29);
  let order = 0;
  while (currentDate.getTime() <= endDate.getTime() && order < 1000) {
    tasks.push({ date: new Date(currentDate), text: "", order: order++ });
    currentDate = addDays(currentDate, 30);
  }
  return tasks;
}

function generateSemiMonthlyTasks(start: Date, endDate: Date): GeneratedTask[] {
  const tasks: GeneratedTask[] = [];
  // First task = Start Date + 14 days, every next task = +15 days
  // Handle month-length variation safely, no date drift
  let currentDate = addDays(normalizeToLocalMidnight(start), 14);
  let order = 0;
  while (currentDate.getTime() <= endDate.getTime() && order < 1000) {
    tasks.push({ date: new Date(currentDate), text: "", order: order++ });
    currentDate = addDays(currentDate, 15);
  }
  return tasks;
}

function generateTaskDates(startDate: Date, duration: number, durationUnit: DurationUnit, recurrence: Recurrence): GeneratedTask[] {
  if (duration <= 0) return [];
  const start = normalizeToLocalMidnight(startDate);
  const endDate = calculateEndDate(start, duration, durationUnit);
  
  switch (recurrence) {
    case "daily": return generateDailyTasks(start, endDate);
    case "weekly": return generateWeeklyTasks(start, endDate);
    case "semi-weekly": return generateSemiWeeklyTasks(start, endDate);
    case "monthly": return generateMonthlyTasks(start, endDate);
    case "semi-monthly": return generateSemiMonthlyTasks(start, endDate);
    default: return generateDailyTasks(start, endDate);
  }
}

export default function CreateDreamScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { theme } = useTheme();
  const { token } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedType, setSelectedType] = useState<DreamTypeOption>(route.params?.type || "personal");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  
  const [duration, setDuration] = useState<string>("4");
  const [durationUnit, setDurationUnit] = useState<DurationUnit>("weeks");
  const [recurrence, setRecurrence] = useState<Recurrence>("weekly");
  
  const [showDurationUnitPicker, setShowDurationUnitPicker] = useState(false);
  const [showRecurrencePicker, setShowRecurrencePicker] = useState(false);
  
  const [webDateModal, setWebDateModal] = useState<'start' | null>(null);
  const [tempWebDate, setTempWebDate] = useState("");

  const [generatedTasks, setGeneratedTasks] = useState<GeneratedTask[]>([]);
  const [showAllTasks, setShowAllTasks] = useState(false);

  useEffect(() => {
    if (route.params?.type) {
      setSelectedType(route.params.type);
    }
  }, [route.params?.type]);

  useEffect(() => {
    const durationNum = parseInt(duration, 10);
    if (durationNum > 0 && startDate) {
      const tasks = generateTaskDates(startDate, durationNum, durationUnit, recurrence);
      setGeneratedTasks(tasks);
      setShowAllTasks(false);
    } else {
      setGeneratedTasks([]);
      setShowAllTasks(false);
    }
  }, [startDate, duration, durationUnit, recurrence]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const handleDateButtonPress = () => {
    if (Platform.OS === 'web') {
      setTempWebDate(formatDateForInput(startDate));
      setWebDateModal('start');
    } else {
      setShowStartPicker(true);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleWebDateConfirm = () => {
    const newDate = new Date(tempWebDate);
    if (!isNaN(newDate.getTime())) {
      const today = normalizeToLocalMidnight(new Date());
      const selected = normalizeToLocalMidnight(newDate);
      if (selected.getTime() >= today.getTime()) {
        setStartDate(newDate);
      } else {
        setError("Start date cannot be in the past");
      }
    }
    setWebDateModal(null);
  };

  const onStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setStartDate(selectedDate);
    }
  };

  const handleDurationChange = (text: string) => {
    const numericText = text.replace(/[^0-9]/g, '');
    setDuration(numericText);
  };

  const updateTaskText = (index: number, text: string) => {
    setGeneratedTasks(prev => prev.map((task, i) => 
      i === index ? { ...task, text } : task
    ));
  };

  const applyFirstTaskToAll = () => {
    if (generatedTasks.length === 0) return;
    const firstTaskText = generatedTasks[0].text;
    if (!firstTaskText.trim()) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setGeneratedTasks(prev => prev.map(task => ({ ...task, text: firstTaskText })));
  };

  const handleCreate = async () => {
    setError("");
    
    if (!title.trim()) {
      setError("Please enter a dream name");
      return;
    }
    if (title.length > 24) {
      setError("Dream name must be 24 characters or less");
      return;
    }
    if (description && description.length > 60) {
      setError("Description must be 60 characters or less");
      return;
    }
    
    const durationNum = parseInt(duration, 10);
    if (!durationNum || durationNum <= 0) {
      setError("Duration must be a positive number");
      return;
    }
    
    const validRecurrences = getValidRecurrences(durationUnit);
    if (!validRecurrences.includes(recurrence)) {
      setError(`${recurrence} is not valid for ${durationUnit} duration. Please select: ${validRecurrences.join(", ")}`);
      return;
    }
    
    if (generatedTasks.length === 0) {
      setError("No tasks can be generated with this combination. Please adjust duration or recurrence.");
      return;
    }
    
    if (!token) return;

    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const response = await fetch(new URL('/api/dreams', getApiUrl()).toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          type: selectedType,
          startDate: startDate.toISOString(),
          duration: durationNum,
          durationUnit: durationUnit,
          recurrence: recurrence,
          tasks: generatedTasks.map(t => t.text),
        }),
      });

      if (response.ok) {
        const dream = await response.json();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        navigation.navigate("DreamDetail", { dreamId: dream.id });
      } else {
        const data = await response.json();
        setError(data.error || "Failed to create dream");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const durationUnitOptions: { value: DurationUnit; label: string }[] = [
    { value: "days", label: "Days" },
    { value: "weeks", label: "Weeks" },
    { value: "months", label: "Months" },
    { value: "years", label: "Years" },
  ];

  const recurrenceOptions: { value: Recurrence; label: string }[] = [
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "semi-weekly", label: "Semi-Weekly" },
    { value: "monthly", label: "Monthly" },
    { value: "semi-monthly", label: "Semi-Monthly" },
  ];

  const targetDate = useMemo(() => {
    const durationNum = parseInt(duration, 10);
    if (durationNum > 0) {
      return calculateEndDate(startDate, durationNum, durationUnit);
    }
    return null;
  }, [startDate, duration, durationUnit]);

  return (
    <GalaxyBackground>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: headerHeight + Spacing.xl,
            paddingBottom: tabBarHeight + Spacing.xl + 60,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.springify()}>
          <ThemedText type="h2" style={styles.title}>Create Your Dream</ThemedText>
          <ThemedText type="body" style={styles.subtitle}>
            Set a goal and start your journey
          </ThemedText>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <View style={styles.labelRow}>
            <ThemedText type="small" style={styles.label}>DREAM NAME</ThemedText>
            <ThemedText type="small" style={styles.charCount}>{title.length}/24</ThemedText>
          </View>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={(text) => setTitle(text.slice(0, 24))}
            placeholder="e.g., Learn to play guitar"
            placeholderTextColor="#8B7FC7"
            maxLength={24}
            testID="input-dream-title"
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150).springify()}>
          <View style={styles.labelRow}>
            <ThemedText type="small" style={styles.label}>DESCRIPTION (OPTIONAL)</ThemedText>
            <ThemedText type="small" style={styles.charCount}>{description.length}/60</ThemedText>
          </View>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={(text) => setDescription(text.slice(0, 60))}
            placeholder="Describe your dream..."
            placeholderTextColor="#8B7FC7"
            multiline
            numberOfLines={2}
            maxLength={60}
            testID="input-dream-description"
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <ThemedText type="small" style={styles.label}>DURATION</ThemedText>
          <View style={styles.durationRow}>
            <TextInput
              style={[styles.input, styles.durationInput]}
              value={duration}
              onChangeText={handleDurationChange}
              placeholder="4"
              placeholderTextColor="#8B7FC7"
              keyboardType="number-pad"
              testID="input-duration"
            />
            <Pressable
              style={styles.dropdownButton}
              onPress={() => setShowDurationUnitPicker(true)}
              testID="button-duration-unit"
            >
              <ThemedText style={styles.dropdownText}>
                {durationUnitOptions.find(o => o.value === durationUnit)?.label}
              </ThemedText>
              <Feather name="chevron-down" size={16} color="#A78BFA" />
            </Pressable>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(250).springify()}>
          <ThemedText type="small" style={styles.label}>OCCURRENCE</ThemedText>
          <Pressable
            style={styles.dropdownButtonFull}
            onPress={() => setShowRecurrencePicker(true)}
            testID="button-recurrence"
          >
            <ThemedText style={styles.dropdownText}>
              {recurrenceOptions.find(o => o.value === recurrence)?.label}
            </ThemedText>
            <Feather name="chevron-down" size={16} color="#A78BFA" />
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <ThemedText type="small" style={styles.label}>START DATE</ThemedText>
          <Pressable 
            style={styles.dateButtonFull}
            onPress={handleDateButtonPress}
            testID="button-start-date"
          >
            <Feather name="calendar" size={18} color="#A78BFA" />
            <ThemedText style={styles.dateValue}>{formatDate(startDate)}</ThemedText>
          </Pressable>
          {targetDate ? (
            <View style={styles.targetDateInfo}>
              <Feather name="flag" size={14} color="#22C55E" />
              <ThemedText type="small" style={styles.targetDateText}>
                Target completion: {formatDate(targetDate)}
              </ThemedText>
            </View>
          ) : null}
        </Animated.View>

        {Platform.OS !== 'web' && showStartPicker && DateTimePicker ? (
          <DateTimePicker
            value={startDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onStartDateChange}
            minimumDate={new Date()}
          />
        ) : null}

        {generatedTasks.length > 0 ? (
          <Animated.View entering={FadeInDown.delay(350).springify()}>
            <View style={styles.tasksHeader}>
              <ThemedText type="small" style={styles.label}>
                GENERATED TASKS ({generatedTasks.length})
              </ThemedText>
              {generatedTasks[0]?.text.trim() ? (
                <Pressable 
                  onPress={applyFirstTaskToAll}
                  style={styles.applyAllButton}
                  testID="button-apply-all"
                >
                  <Feather name="copy" size={14} color="#A78BFA" />
                  <ThemedText type="small" style={styles.applyAllText}>
                    Apply to all
                  </ThemedText>
                </Pressable>
              ) : null}
            </View>
            <ThemedText type="small" style={styles.helperText}>
              Fill in the first task, then tap "Apply to all" to copy it
            </ThemedText>
            
            <View style={styles.tasksList}>
              {(showAllTasks ? generatedTasks : generatedTasks.slice(0, 10)).map((task, index) => (
                <View key={index} style={styles.taskItem}>
                  <View style={styles.taskNumber}>
                    <ThemedText style={styles.taskNumberText}>{index + 1}</ThemedText>
                  </View>
                  <View style={styles.taskContent}>
                    <TextInput
                      style={styles.taskInput}
                      value={task.text}
                      onChangeText={(text) => updateTaskText(index, text)}
                      placeholder="Enter task description..."
                      placeholderTextColor="#8B7FC7"
                      testID={`input-task-${index}`}
                    />
                    <ThemedText type="small" style={styles.taskDate}>
                      {formatDate(task.date)}
                    </ThemedText>
                  </View>
                </View>
              ))}
              {generatedTasks.length > 10 ? (
                <Pressable 
                  onPress={() => setShowAllTasks(!showAllTasks)}
                  style={styles.moreTasksButton}
                  testID="button-toggle-tasks"
                >
                  <Feather 
                    name={showAllTasks ? "chevron-up" : "chevron-down"} 
                    size={16} 
                    color="#A78BFA" 
                  />
                  <ThemedText type="small" style={styles.moreTasksText}>
                    {showAllTasks ? "Show less" : `+${generatedTasks.length - 10} more tasks...`}
                  </ThemedText>
                </Pressable>
              ) : null}
            </View>
          </Animated.View>
        ) : null}

        {error ? (
          <ThemedText type="small" style={styles.errorText}>{error}</ThemedText>
        ) : null}

        <Animated.View entering={FadeInDown.delay(400).springify()}>
          <View style={styles.progressInfo}>
            <Feather name="info" size={16} color="#A78BFA" />
            <ThemedText type="small" style={styles.progressInfoText}>
              {generatedTasks.length} tasks will be created based on your schedule
            </ThemedText>
          </View>
          
          <Button
            onPress={handleCreate}
            disabled={isLoading}
            style={styles.createButton}
            testID="button-submit-dream"
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <View style={styles.buttonContent}>
                <Feather name="star" size={20} color="#FFFFFF" />
                <ThemedText style={styles.buttonText}>Start My Dream</ThemedText>
              </View>
            )}
          </Button>
        </Animated.View>
      </ScrollView>

      <Modal
        visible={webDateModal !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setWebDateModal(null)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setWebDateModal(null)}
        >
          <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
            <ThemedText type="h3" style={styles.modalTitle}>Select Start Date</ThemedText>
            
            <TextInput
              style={styles.webDateInput}
              value={tempWebDate}
              onChangeText={setTempWebDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor="#8B7FC7"
              keyboardType="default"
              testID="input-web-date"
            />
            
            <ThemedText type="small" style={styles.dateHelperText}>
              Enter date in format: YYYY-MM-DD
            </ThemedText>

            <View style={styles.modalButtons}>
              <Button 
                variant="outline" 
                onPress={() => setWebDateModal(null)}
                style={styles.modalButton}
              >
                Cancel
              </Button>
              <Button 
                onPress={handleWebDateConfirm}
                style={styles.modalButton}
                testID="button-confirm-date"
              >
                Confirm
              </Button>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={showDurationUnitPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDurationUnitPicker(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setShowDurationUnitPicker(false)}
        >
          <View style={styles.pickerModalContent}>
            <ThemedText type="h4" style={styles.pickerTitle}>Duration Unit</ThemedText>
            {durationUnitOptions.map(option => (
              <Pressable
                key={option.value}
                style={[
                  styles.pickerOption,
                  durationUnit === option.value && styles.pickerOptionSelected,
                ]}
                onPress={() => {
                  const newUnit = option.value;
                  setDurationUnit(newUnit);
                  const validRecurrences = getValidRecurrences(newUnit);
                  if (!validRecurrences.includes(recurrence)) {
                    setRecurrence(getDefaultRecurrence(newUnit));
                  }
                  setShowDurationUnitPicker(false);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <ThemedText style={[
                  styles.pickerOptionText,
                  durationUnit === option.value && styles.pickerOptionTextSelected,
                ]}>
                  {option.label}
                </ThemedText>
                {durationUnit === option.value ? (
                  <Feather name="check" size={18} color="#8B5CF6" />
                ) : null}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      <Modal
        visible={showRecurrencePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRecurrencePicker(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setShowRecurrencePicker(false)}
        >
          <View style={styles.pickerModalContent}>
            <ThemedText type="h4" style={styles.pickerTitle}>Re-occurrence</ThemedText>
            {recurrenceOptions
              .filter(option => getValidRecurrences(durationUnit).includes(option.value))
              .map(option => (
              <Pressable
                key={option.value}
                style={[
                  styles.pickerOption,
                  recurrence === option.value && styles.pickerOptionSelected,
                ]}
                onPress={() => {
                  setRecurrence(option.value);
                  setShowRecurrencePicker(false);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <ThemedText style={[
                  styles.pickerOptionText,
                  recurrence === option.value && styles.pickerOptionTextSelected,
                ]}>
                  {option.label}
                </ThemedText>
                {recurrence === option.value ? (
                  <Feather name="check" size={18} color="#8B5CF6" />
                ) : null}
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </GalaxyBackground>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.lg,
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.xs,
    color: "#FFFFFF",
  },
  subtitle: {
    textAlign: "center",
    color: "#C4B5FD",
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  label: {
    fontWeight: "600",
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
    color: "#C4B5FD",
  },
  charCount: {
    color: "#8B7FC7",
    marginBottom: Spacing.sm,
  },
  helperText: {
    color: "#8B7FC7",
    marginBottom: Spacing.sm,
  },
  input: {
    borderRadius: BorderRadius.sm,
    padding: Spacing.lg,
    fontSize: 16,
    backgroundColor: "rgba(45, 39, 82, 0.6)",
    color: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(139, 127, 199, 0.3)",
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: "top",
  },
  durationRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  durationInput: {
    flex: 1,
    textAlign: "center",
  },
  dropdownButton: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(45, 39, 82, 0.6)",
    borderRadius: BorderRadius.sm,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(139, 127, 199, 0.3)",
  },
  dropdownButtonFull: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(45, 39, 82, 0.6)",
    borderRadius: BorderRadius.sm,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(139, 127, 199, 0.3)",
  },
  dropdownText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  dateButtonFull: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: "rgba(45, 39, 82, 0.6)",
    borderRadius: BorderRadius.sm,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(139, 127, 199, 0.3)",
  },
  dateValue: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  targetDateInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  targetDateText: {
    color: "#22C55E",
  },
  tasksHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  applyAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    backgroundColor: "rgba(139, 92, 246, 0.2)",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  applyAllText: {
    color: "#A78BFA",
  },
  tasksList: {
    gap: Spacing.sm,
  },
  taskItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: "rgba(45, 39, 82, 0.4)",
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: "rgba(139, 127, 199, 0.2)",
  },
  taskNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#8B5CF6",
    alignItems: "center",
    justifyContent: "center",
  },
  taskNumberText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  taskContent: {
    flex: 1,
  },
  taskInput: {
    color: "#FFFFFF",
    fontSize: 14,
    padding: 0,
    marginBottom: 2,
  },
  taskDate: {
    color: "#8B7FC7",
    fontSize: 11,
  },
  moreTasksButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
    backgroundColor: "rgba(139, 127, 199, 0.15)",
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
  },
  moreTasksText: {
    color: "#A78BFA",
    textAlign: "center",
  },
  progressInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: "rgba(167, 139, 250, 0.1)",
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  progressInfoText: {
    color: "#C4B5FD",
    flex: 1,
  },
  errorText: {
    color: "#EF4444",
    textAlign: "center",
  },
  createButton: {
    marginTop: Spacing.sm,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: "#1E1B2E",
    borderRadius: BorderRadius.md,
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  modalTitle: {
    color: "#FFFFFF",
    textAlign: "center",
  },
  webDateInput: {
    backgroundColor: "rgba(139, 127, 199, 0.2)",
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    color: "#FFFFFF",
    fontSize: 18,
    textAlign: "center",
  },
  dateHelperText: {
    color: "#8B7FC7",
    textAlign: "center",
  },
  modalButtons: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  modalButton: {
    flex: 1,
  },
  pickerModalContent: {
    backgroundColor: "#1E1B2E",
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
  },
  pickerTitle: {
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: Spacing.lg,
  },
  pickerOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  pickerOptionSelected: {
    backgroundColor: "rgba(139, 92, 246, 0.2)",
  },
  pickerOptionText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  pickerOptionTextSelected: {
    color: "#8B5CF6",
    fontWeight: "600",
  },
});
