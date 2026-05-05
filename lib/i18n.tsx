import { useQuery } from "convex/react";
import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { NativeModules, Platform } from "react-native";

import { api } from "@/convex/_generated/api";
import { useAuth } from "@/lib/auth";

export type AppLanguage = "pt-PT" | "en-US";

type TranslationParams = Record<string, number | string>;
type TranslationValue = string | ((params: TranslationParams) => string);
type TranslationKey = keyof typeof translations["en-US"];

type I18nContextValue = {
  locale: AppLanguage;
  setPreferredLanguage: (language: AppLanguage | null) => void;
  t: (key: TranslationKey, params?: Record<string, number | string>) => string;
};

const goalOptionKeys = [
  "build_new_habits",
  "stay_consistent",
  "track_progress",
  "improve_focus",
  "reduce_stress",
  "finish_tasks",
] as const;

const categoryOptionKeys = ["work", "health", "study", "personal"] as const;

const translations = {
  "en-US": {
    "app.modalTitle": "This is a modal",
    "app.modalLink": "Go to home screen",
    "app.newTask": "New Task",
    "tabs.today": "Today",
    "tabs.plan": "Plan",
    "tabs.stats": "Stats",
    "tabs.settings": "Settings",
    "common.email": "Email",
    "common.password": "Password",
    "common.cancel": "Cancel",
    "common.back": "Back",
    "common.continue": "Continue",
    "common.save": "Save",
    "common.add": "Add",
    "common.anyTime": "Any time",
    "common.allDay": "All day",
    "common.general": "General",
    "common.portuguese": "Portugu\u00eas",
    "common.english": "English",
    "common.theme.system": "System",
    "common.theme.light": "Light",
    "common.theme.dark": "Dark",
    "common.language.portugueseLabel": "Portuguese",
    "common.language.englishLabel": "English",
    "common.frequency.daily": "Daily",
    "common.frequency.weekly": "Weekly",
    "common.frequency.monthly": "Monthly",
    "common.frequency.dailyDescription": "Every day",
    "common.frequency.weeklyDescription": "Choose weekdays",
    "common.frequency.monthlyDescription": "Once per month",
    "auth.login.validation": "Enter your email and password.",
    "auth.login.error": "Unable to sign in.",
    "auth.login.subtitle": "Small routines, visible momentum.",
    "auth.login.title": "Welcome back",
    "auth.login.continue": "Continue",
    "auth.login.noAccount": "No account yet?",
    "auth.login.startSetup": "Start setup",
    "auth.signup.step1Title": "Who is building momentum?",
    "auth.signup.step1Subtitle": "Tell us who is protecting better routines.",
    "auth.signup.step2Title": "Create your Taskly account",
    "auth.signup.step2Subtitle": "A local school-project login for your habits.",
    "auth.signup.step3Title": "What should Taskly help you protect?",
    "auth.signup.step3Subtitle": "Pick outcomes so coaching and suggested tasks feel useful.",
    "auth.signup.step4Title": "Choose a consistency target",
    "auth.signup.step4Subtitle": "Five days per week is ambitious without being brittle.",
    "auth.signup.firstName": "First Name",
    "auth.signup.lastName": "Last Name",
    "auth.signup.passwordPlaceholder": "At least 6 characters",
    "auth.signup.hint": ({ count }) => `Aiming for ${count} days a week helps build consistency.`,
    "auth.signup.error": "Could not create account.",
    "auth.signup.creating": "Creating...",
    "auth.signup.finishSetup": "Finish setup",
    "auth.signup.stepCounter": ({ current, total }) => `${current} of ${total}`,
    "home.progressLabel": "One good day",
    "home.progressTitle": "Today progress",
    "home.habitsCompleted": "habits completed",
    "home.streak": "STREAK",
    "home.done": "DONE",
    "home.points": "POINTS",
    "home.aiTitle": "AI insight",
    "home.aiThinking": "Thinking...",
    "home.aiGenerate": "Generate",
    "home.aiEmpty": "Generate a coaching note after you complete a few tasks.",
    "home.aiError": "Could not generate insights.",
    "home.sectionTitle": "Today",
    "home.sectionMeta": ({ completed, total }) => `${completed} of ${total} tasks done`,
    "home.emptyTitle": "No tasks planned",
    "home.emptySubtitle": "Create your first Taskly habit and start building momentum.",
    "home.createTask": "Create Task",
    "todo.title": "My Plan",
    "todo.activeTasks": "Active Tasks",
    "todo.sortByTime": "SORT BY TIME",
    "todo.emptyTitle": "Nothing here yet",
    "todo.emptySubtitle": "Create a recurring task to fill your plan.",
    "stats.subtitle": "Habit consistency",
    "stats.selectedDay": "Selected day",
    "stats.complete": "Complete",
    "stats.avgCompletion": "Avg. Completion",
    "stats.totalPoints": "Total Points",
    "stats.bestDay": "Best Day",
    "stats.detailSubtitle": ({ completed, total }) => `${completed} of ${total} habits completed`,
    "stats.emptyTitle": "No habits logged",
    "stats.emptySubtitle": "Pick a day with activity to see its completed habits.",
    "settings.title": "Settings",
    "settings.defaultUser": "Taskly User",
    "settings.profileMeta": "Local school-project account",
    "settings.focusColor": "Focus Color",
    "settings.focusColorSubtitle": "Choose the accent used in progress, heatmap and actions.",
    "settings.theme": "Theme",
    "settings.themeSubtitle": "Stored in your Taskly profile for app-wide appearance.",
    "settings.language": "Language",
    "settings.languageSubtitle": "Choose the language used across the authenticated app.",
    "settings.account": "Account",
    "settings.accountSubtitle": "This version uses simple local authentication for the M16 delivery.",
    "settings.signOut": "Sign Out",
    "settings.color.sky": "Sky",
    "settings.color.mint": "Mint",
    "settings.color.coral": "Coral",
    "settings.color.red": "Red",
    "settings.color.violet": "Violet",
    "settings.color.pink": "Pink",
    "settings.color.cyan": "Cyan",
    "settings.color.lime": "Lime",
    "create.validation": "Please enter a task name.",
    "create.error": "Failed to create task.",
    "create.title": "New Task",
    "create.heroPlaceholder": "What needs to be done?",
    "create.schedule": "Schedule",
    "create.repeatsOn": "Repeats on",
    "create.time": "Time",
    "create.notes": "Notes",
    "create.notesPlaceholder": "Add optional context",
    "create.creating": "Creating...",
    "create.createTask": "Create Task",
    "goals.build_new_habits": "Build new habits",
    "goals.stay_consistent": "Stay consistent",
    "goals.track_progress": "Track progress",
    "goals.improve_focus": "Improve focus",
    "goals.reduce_stress": "Reduce stress",
    "goals.finish_tasks": "Finish tasks",
    "categories.work": "Work",
    "categories.health": "Health",
    "categories.study": "Study",
    "categories.personal": "Personal",
  },
  "pt-PT": {
    "app.modalTitle": "Isto \u00e9 um modal",
    "app.modalLink": "Ir para o ecr\u00e3 principal",
    "app.newTask": "Nova Tarefa",
    "tabs.today": "Hoje",
    "tabs.plan": "Plano",
    "tabs.stats": "Estat\u00edsticas",
    "tabs.settings": "Defini\u00e7\u00f5es",
    "common.email": "Email",
    "common.password": "Palavra-passe",
    "common.cancel": "Cancelar",
    "common.back": "Voltar",
    "common.continue": "Continuar",
    "common.save": "Guardar",
    "common.add": "Adicionar",
    "common.anyTime": "Qualquer hora",
    "common.allDay": "Todo o dia",
    "common.general": "Geral",
    "common.portuguese": "Portugu\u00eas",
    "common.english": "English",
    "common.theme.system": "Sistema",
    "common.theme.light": "Claro",
    "common.theme.dark": "Escuro",
    "common.language.portugueseLabel": "Portugu\u00eas",
    "common.language.englishLabel": "Ingl\u00eas",
    "common.frequency.daily": "Di\u00e1rio",
    "common.frequency.weekly": "Semanal",
    "common.frequency.monthly": "Mensal",
    "common.frequency.dailyDescription": "Todos os dias",
    "common.frequency.weeklyDescription": "Escolhe os dias",
    "common.frequency.monthlyDescription": "Uma vez por m\u00eas",
    "auth.login.validation": "Introduz o teu email e a tua palavra-passe.",
    "auth.login.error": "N\u00e3o foi poss\u00edvel iniciar sess\u00e3o.",
    "auth.login.subtitle": "Pequenas rotinas, progresso vis\u00edvel.",
    "auth.login.title": "Bem-vindo de volta",
    "auth.login.continue": "Continuar",
    "auth.login.noAccount": "Ainda n\u00e3o tens conta?",
    "auth.login.startSetup": "Come\u00e7ar configura\u00e7\u00e3o",
    "auth.signup.step1Title": "Quem est\u00e1 a ganhar ritmo?",
    "auth.signup.step1Subtitle": "Diz-nos quem quer proteger melhores rotinas.",
    "auth.signup.step2Title": "Cria a tua conta Taskly",
    "auth.signup.step2Subtitle": "Um login local do projeto escolar para os teus h\u00e1bitos.",
    "auth.signup.step3Title": "O que queres que a Taskly te ajude a proteger?",
    "auth.signup.step3Subtitle": "Escolhe objetivos para tornar o coaching e as sugest\u00f5es mais \u00fateis.",
    "auth.signup.step4Title": "Escolhe uma meta de consist\u00eancia",
    "auth.signup.step4Subtitle": "Cinco dias por semana \u00e9 ambicioso sem ser fr\u00e1gil.",
    "auth.signup.firstName": "Primeiro nome",
    "auth.signup.lastName": "Apelido",
    "auth.signup.passwordPlaceholder": "Pelo menos 6 caracteres",
    "auth.signup.hint": ({ count }) => `Apontar para ${count} dias por semana ajuda a criar consist\u00eancia.`,
    "auth.signup.error": "N\u00e3o foi poss\u00edvel criar a conta.",
    "auth.signup.creating": "A criar...",
    "auth.signup.finishSetup": "Terminar configura\u00e7\u00e3o",
    "auth.signup.stepCounter": ({ current, total }) => `${current} de ${total}`,
    "home.progressLabel": "Um bom dia",
    "home.progressTitle": "Progresso de hoje",
    "home.habitsCompleted": "h\u00e1bitos conclu\u00eddos",
    "home.streak": "SEQU\u00caNCIA",
    "home.done": "FEITO",
    "home.points": "PONTOS",
    "home.aiTitle": "Sugest\u00e3o IA",
    "home.aiThinking": "A pensar...",
    "home.aiGenerate": "Gerar",
    "home.aiEmpty": "Gera uma nota de coaching depois de conclu\u00edres algumas tarefas.",
    "home.aiError": "N\u00e3o foi poss\u00edvel gerar sugest\u00f5es.",
    "home.sectionTitle": "Hoje",
    "home.sectionMeta": ({ completed, total }) => `${completed} de ${total} tarefas feitas`,
    "home.emptyTitle": "Sem tarefas planeadas",
    "home.emptySubtitle": "Cria o teu primeiro h\u00e1bito Taskly e come\u00e7a a ganhar ritmo.",
    "home.createTask": "Criar tarefa",
    "todo.title": "O Meu Plano",
    "todo.activeTasks": "Tarefas Ativas",
    "todo.sortByTime": "ORDENAR POR HORA",
    "todo.emptyTitle": "Ainda n\u00e3o h\u00e1 nada aqui",
    "todo.emptySubtitle": "Cria uma tarefa recorrente para preencher o teu plano.",
    "stats.subtitle": "Consist\u00eancia dos h\u00e1bitos",
    "stats.selectedDay": "Dia selecionado",
    "stats.complete": "Conclu\u00eddo",
    "stats.avgCompletion": "M\u00e9dia de conclus\u00e3o",
    "stats.totalPoints": "Pontos totais",
    "stats.bestDay": "Melhor dia",
    "stats.detailSubtitle": ({ completed, total }) => `${completed} de ${total} h\u00e1bitos conclu\u00eddos`,
    "stats.emptyTitle": "Sem h\u00e1bitos registados",
    "stats.emptySubtitle": "Escolhe um dia com atividade para veres os h\u00e1bitos conclu\u00eddos.",
    "settings.title": "Defini\u00e7\u00f5es",
    "settings.defaultUser": "Utilizador Taskly",
    "settings.profileMeta": "Conta local do projeto escolar",
    "settings.focusColor": "Cor de foco",
    "settings.focusColorSubtitle": "Escolhe o destaque usado no progresso, mapa de calor e a\u00e7\u00f5es.",
    "settings.theme": "Tema",
    "settings.themeSubtitle": "Guardado no teu perfil Taskly para toda a aplica\u00e7\u00e3o.",
    "settings.language": "Idioma",
    "settings.languageSubtitle": "Escolhe o idioma usado em toda a app autenticada.",
    "settings.account": "Conta",
    "settings.accountSubtitle": "Esta vers\u00e3o usa autentica\u00e7\u00e3o local simples para a entrega de M16.",
    "settings.signOut": "Terminar sess\u00e3o",
    "settings.color.sky": "C\u00e9u",
    "settings.color.mint": "Menta",
    "settings.color.coral": "Coral",
    "settings.color.red": "Vermelho",
    "settings.color.violet": "Violeta",
    "settings.color.pink": "Rosa",
    "settings.color.cyan": "Ciano",
    "settings.color.lime": "Lima",
    "create.validation": "Introduz um nome para a tarefa.",
    "create.error": "N\u00e3o foi poss\u00edvel criar a tarefa.",
    "create.title": "Nova Tarefa",
    "create.heroPlaceholder": "O que precisa de ser feito?",
    "create.schedule": "Agenda",
    "create.repeatsOn": "Repete em",
    "create.time": "Hora",
    "create.notes": "Notas",
    "create.notesPlaceholder": "Adicionar contexto opcional",
    "create.creating": "A criar...",
    "create.createTask": "Criar tarefa",
    "goals.build_new_habits": "Criar novos h\u00e1bitos",
    "goals.stay_consistent": "Manter consist\u00eancia",
    "goals.track_progress": "Acompanhar progresso",
    "goals.improve_focus": "Melhorar foco",
    "goals.reduce_stress": "Reduzir stress",
    "goals.finish_tasks": "Concluir tarefas",
    "categories.work": "Trabalho",
    "categories.health": "Sa\u00fade",
    "categories.study": "Estudo",
    "categories.personal": "Pessoal",
  },
} as const satisfies Record<AppLanguage, Record<string, TranslationValue>>;

const backendErrorTranslations: Record<string, TranslationKey> = {
  "This email is already registered.": "auth.signup.error",
  "Invalid email or password.": "auth.login.error",
};

const I18nContext = createContext<I18nContextValue | null>(null);

function getLocaleFromNativeModules() {
  if (Platform.OS === "web") {
    return globalThis.navigator?.language;
  }

  const settings = NativeModules.SettingsManager?.settings;
  const appleLocale = settings?.AppleLocale ?? settings?.AppleLanguages?.[0];
  const androidLocale = NativeModules.I18nManager?.localeIdentifier;
  const intlLocale = Intl.DateTimeFormat().resolvedOptions().locale;
  return appleLocale ?? androidLocale ?? intlLocale;
}

export function resolveLanguage(locale?: string | null): AppLanguage {
  if (!locale) {
    return "en-US";
  }

  return locale.toLowerCase().startsWith("pt") ? "pt-PT" : "en-US";
}

export function getSystemLanguage() {
  return resolveLanguage(getLocaleFromNativeModules());
}

function translate(locale: AppLanguage, key: TranslationKey, params?: TranslationParams) {
  const value = translations[locale][key];
  if (typeof value === "function") {
    return value(params ?? {});
  }
  return value;
}

export function I18nProvider({ children }: PropsWithChildren) {
  const { sessionToken, user } = useAuth();
  const userSettings = useQuery(api.habits.getUserSettings, sessionToken ? { sessionToken } : "skip");
  const systemLanguage = useMemo(() => getSystemLanguage(), []);
  const [preferredLanguage, setPreferredLanguage] = useState<AppLanguage | null>(null);

  useEffect(() => {
    if (!sessionToken) {
      setPreferredLanguage(null);
    }
  }, [sessionToken]);

  const locale = preferredLanguage ?? userSettings?.language ?? user?.language ?? systemLanguage;

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setPreferredLanguage,
      t: (key, params) => translate(locale, key, params),
    }),
    [locale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) {
    throw new Error("useI18n must be used inside I18nProvider.");
  }
  return value;
}

export function getGoalOptions(locale: AppLanguage) {
  return goalOptionKeys.map((key) => ({
    key,
    label: translate(locale, `goals.${key}` as TranslationKey),
  }));
}

export function getCategoryOptions(locale: AppLanguage) {
  return categoryOptionKeys.map((key) => ({
    key,
    label: translate(locale, `categories.${key}` as TranslationKey),
  }));
}

export function getWeekdayInitials(locale: AppLanguage) {
  return locale === "pt-PT" ? ["D", "S", "T", "Q", "Q", "S", "S"] : ["S", "M", "T", "W", "T", "F", "S"];
}

export function getWeekdayShortNames(locale: AppLanguage) {
  return locale === "pt-PT"
    ? ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "S\u00e1b"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
}

export function localizeBackendError(locale: AppLanguage, message: string, fallbackKey: TranslationKey) {
  const key = backendErrorTranslations[message];
  return translate(locale, key ?? fallbackKey);
}
