"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useTheme } from "next-themes";
import {
  Bell,
  CreditCard,
  Download,
  Info,
  Lock,
  Monitor,
  Palette,
  Save,
  Send,
  ShieldCheck,
  Smartphone,
  Trash2,
  User
} from "lucide-react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { useLanguage } from "@/components/providers/language-provider";
import { useToast } from "@/components/ui/toast";
import type { Locale } from "@/lib/i18n/messages";
import { initials } from "@/lib/utils";

type SettingsSection = "profile" | "appearance" | "game" | "notifications" | "security" | "subscription" | "about";

const copy = {
  en: {
    badge: "Settings",
    title: "SudokuMind Settings",
    subtitle: "Game and visual preferences apply instantly. Account fields are saved explicitly.",
    unsaved: "You have unsaved changes",
    save: "Save",
    saved: "Saved ✓",
    canceled: "Changes cancelled",
    cancel: "Cancel",
    sections: {
      profile: "Profile",
      appearance: "Appearance",
      game: "Game",
      notifications: "Notifications",
      security: "Security",
      subscription: "Subscription",
      about: "About"
    },
    profile: {
      title: "Profile",
      removePhoto: "Remove photo",
      name: "Name",
      username: "Username",
      usernameHelp: "Availability check is ready for the backend debounce API.",
      emailHelp: "Changing email will send a confirmation message.",
      city: "City",
      saveChanges: "Save changes",
      danger: "Danger zone",
      deleteHelp: "Type DELETE to confirm account deletion.",
      deleteWord: "DELETE",
      deleteAccount: "Delete account"
    },
    appearance: {
      title: "Appearance",
      themes: { light: "Light", dark: "Dark", system: "System" },
      accent: "Accent color",
      colors: ["Turquoise", "Blue", "Purple", "Pink", "Orange", "Green", "Red", "Yellow"],
      digitFont: ["Standard", "Rounded", "Monospace"],
      cellSize: "Cell size",
      sizes: ["Small", "Medium", "Large"],
      animations: "Enable animations",
      sounds: "Sound effects",
      skins: "Board skins",
      skinNames: ["Classic", "Wood", "Minimal", "Neon", "Paper", "Night"]
    },
    game: {
      title: "Game",
      defaultDifficulty: "Default difficulty",
      easy: "Easy",
      medium: "Medium",
      hard: "Hard",
      expert: "Expert",
      autoPause: "Auto-pause when tab is hidden",
      instantErrors: "Highlight errors instantly",
      related: "Highlight related cells",
      matching: "Highlight matching numbers",
      hardcore: "Hardcore mode",
      autoFill: "Auto-fill last candidate",
      mistakeLimit: "Mistake limit",
      unlimited: "Unlimited",
      timer: "Timer",
      countUp: "Count up",
      countDown: "Count down",
      hidden: "Hidden"
    },
    notifications: {
      title: "Notifications",
      daily: "Daily reminder",
      time: "Reminder time",
      streak: "Streak reminder",
      xp: "XP achievements",
      level: "New level",
      weekly: "Weekly email report",
      test: "Test notification"
    },
    security: {
      title: "Security",
      currentPassword: "Current password",
      newPassword: "New password",
      confirmation: "Confirmation",
      changePassword: "Change password",
      twoFactor: "Two-factor authentication",
      twoFactorHelp: "Disabled. QR-code flow is ready for backend integration.",
      enable2fa: "Enable 2FA",
      current: "Current",
      thisDevice: "This is you now",
      lastLogin: "Last login recently",
      end: "End"
    },
    subscription: {
      title: "Subscription",
      currentPlan: "Current plan",
      freeText: "3 hints per day, basic statistics, classic board.",
      proText: "Unlimited hints, AI Coach, advanced stats, skins, no ads.",
      upgrade: "Upgrade to Pro"
    },
    about: {
      title: "About",
      version: "App version",
      privacy: "Privacy policy",
      terms: "Terms of use",
      bug: "Report a bug",
      export: "Export my data",
      players: "Total players",
      todayGames: "Games today",
      record: "Daily record",
      share: "Share app"
    }
  },
  ru: {
    badge: "Настройки",
    title: "Настройки SudokuMind",
    subtitle: "Игровые и визуальные настройки применяются мгновенно. Данные аккаунта сохраняются отдельной кнопкой.",
    unsaved: "У вас есть несохранённые изменения",
    save: "Сохранить",
    saved: "Сохранено ✓",
    canceled: "Изменения отменены",
    cancel: "Отменить",
    sections: {
      profile: "Профиль",
      appearance: "Внешний вид",
      game: "Игра",
      notifications: "Уведомления",
      security: "Безопасность",
      subscription: "Подписка",
      about: "О приложении"
    },
    profile: {
      title: "Профиль",
      removePhoto: "Удалить фото",
      name: "Имя",
      username: "Username",
      usernameHelp: "Проверка занятости готова для backend debounce API.",
      emailHelp: "При смене email будет отправлено письмо подтверждения.",
      city: "Город",
      saveChanges: "Сохранить изменения",
      danger: "Опасная зона",
      deleteHelp: "Введите УДАЛИТЬ для подтверждения удаления аккаунта.",
      deleteWord: "УДАЛИТЬ",
      deleteAccount: "Удалить аккаунт"
    },
    appearance: {
      title: "Внешний вид",
      themes: { light: "Светлая", dark: "Тёмная", system: "Системная" },
      accent: "Акцентный цвет",
      colors: ["Бирюзовый", "Синий", "Фиолетовый", "Розовый", "Оранжевый", "Зелёный", "Красный", "Жёлтый"],
      digitFont: ["Стандартный", "Округлый", "Моноширинный"],
      cellSize: "Размер ячеек",
      sizes: ["Маленький", "Средний", "Большой"],
      animations: "Включить анимации",
      sounds: "Звуковые эффекты",
      skins: "Скины доски",
      skinNames: ["Классический", "Дерево", "Минимал", "Неон", "Бумага", "Ночной"]
    },
    game: {
      title: "Игра",
      defaultDifficulty: "Сложность по умолчанию",
      easy: "Лёгкий",
      medium: "Средний",
      hard: "Сложный",
      expert: "Эксперт",
      autoPause: "Автопауза при сворачивании вкладки",
      instantErrors: "Подсветка ошибок сразу",
      related: "Подсветка связанных ячеек",
      matching: "Подсветка одинаковых цифр",
      hardcore: "Режим хардкор",
      autoFill: "Автозаполнение последней цифры",
      mistakeLimit: "Лимит ошибок",
      unlimited: "Безлимит",
      timer: "Таймер",
      countUp: "Считать вверх",
      countDown: "Считать вниз",
      hidden: "Скрыть"
    },
    notifications: {
      title: "Уведомления",
      daily: "Ежедневное напоминание",
      time: "Время напоминания",
      streak: "Напомнить о стрике",
      xp: "XP достижения",
      level: "Новый уровень",
      weekly: "Еженедельный отчёт на email",
      test: "Проверить уведомление"
    },
    security: {
      title: "Безопасность",
      currentPassword: "Текущий пароль",
      newPassword: "Новый пароль",
      confirmation: "Подтверждение",
      changePassword: "Изменить пароль",
      twoFactor: "Двухфакторная аутентификация",
      twoFactorHelp: "Выключена. QR-code flow готов для backend подключения.",
      enable2fa: "Включить 2FA",
      current: "Текущая",
      thisDevice: "Это вы сейчас",
      lastLogin: "Последний вход недавно",
      end: "Завершить"
    },
    subscription: {
      title: "Подписка",
      currentPlan: "Текущий план",
      freeText: "3 подсказки в день, базовая статистика, классическая доска.",
      proText: "Безлимитные подсказки, AI Coach, расширенная статистика, скины, без рекламы.",
      upgrade: "Перейти на Pro"
    },
    about: {
      title: "О приложении",
      version: "Версия приложения",
      privacy: "Политика конфиденциальности",
      terms: "Условия использования",
      bug: "Сообщить об ошибке",
      export: "Экспортировать мои данные",
      players: "Всего игроков",
      todayGames: "Игр сегодня",
      record: "Рекорд дня",
      share: "Поделиться приложением"
    }
  },
  kk: {
    badge: "Баптаулар",
    title: "SudokuMind баптаулары",
    subtitle: "Ойын және көрініс баптаулары бірден қолданылады. Аккаунт деректері бөлек сақталады.",
    unsaved: "Сақталмаған өзгерістер бар",
    save: "Сақтау",
    saved: "Сақталды ✓",
    canceled: "Өзгерістер қайтарылды",
    cancel: "Бас тарту",
    sections: {
      profile: "Профиль",
      appearance: "Көрініс",
      game: "Ойын",
      notifications: "Хабарламалар",
      security: "Қауіпсіздік",
      subscription: "Жазылым",
      about: "Қолданба туралы"
    },
    profile: {
      title: "Профиль",
      removePhoto: "Фотоны өшіру",
      name: "Аты",
      username: "Username",
      usernameHelp: "Username тексеруі backend debounce API үшін дайын.",
      emailHelp: "Email өзгерсе, растау хаты жіберіледі.",
      city: "Қала",
      saveChanges: "Өзгерістерді сақтау",
      danger: "Қауіпті аймақ",
      deleteHelp: "Аккаунтты өшіру үшін ӨШІРУ деп жазыңыз.",
      deleteWord: "ӨШІРУ",
      deleteAccount: "Аккаунтты өшіру"
    },
    appearance: {
      title: "Көрініс",
      themes: { light: "Жарық", dark: "Қараңғы", system: "Жүйелік" },
      accent: "Акцент түсі",
      colors: ["Көгілдір", "Көк", "Күлгін", "Қызғылт", "Қызғылт сары", "Жасыл", "Қызыл", "Сары"],
      digitFont: ["Стандарт", "Дөңгелек", "Моно"],
      cellSize: "Ұяшық өлшемі",
      sizes: ["Кіші", "Орта", "Үлкен"],
      animations: "Анимацияларды қосу",
      sounds: "Дыбыс әсерлері",
      skins: "Тақта скиндері",
      skinNames: ["Классика", "Ағаш", "Минимал", "Неон", "Қағаз", "Түнгі"]
    },
    game: {
      title: "Ойын",
      defaultDifficulty: "Әдепкі қиындық",
      easy: "Оңай",
      medium: "Орташа",
      hard: "Қиын",
      expert: "Эксперт",
      autoPause: "Бет жасырылса автопауза",
      instantErrors: "Қателерді бірден көрсету",
      related: "Байланысты ұяшықтарды көрсету",
      matching: "Бірдей сандарды көрсету",
      hardcore: "Хардкор режим",
      autoFill: "Соңғы кандидат санын автоқою",
      mistakeLimit: "Қате лимиті",
      unlimited: "Шексіз",
      timer: "Таймер",
      countUp: "Жоғары санау",
      countDown: "Төмен санау",
      hidden: "Жасыру"
    },
    notifications: {
      title: "Хабарламалар",
      daily: "Күнделікті еске салу",
      time: "Еске салу уақыты",
      streak: "Стрик туралы еске салу",
      xp: "XP жетістіктері",
      level: "Жаңа деңгей",
      weekly: "Апталық email есебі",
      test: "Тест хабарлама"
    },
    security: {
      title: "Қауіпсіздік",
      currentPassword: "Қазіргі құпиясөз",
      newPassword: "Жаңа құпиясөз",
      confirmation: "Растау",
      changePassword: "Құпиясөзді өзгерту",
      twoFactor: "Екі факторлы аутентификация",
      twoFactorHelp: "Өшірулі. QR-code flow backend қосуға дайын.",
      enable2fa: "2FA қосу",
      current: "Ағымдағы",
      thisDevice: "Бұл сіз қазір",
      lastLogin: "Соңғы кіру жақында",
      end: "Аяқтау"
    },
    subscription: {
      title: "Жазылым",
      currentPlan: "Қазіргі жоспар",
      freeText: "Күніне 3 hint, базалық статистика, классикалық тақта.",
      proText: "Шексіз hint, AI Coach, кеңейтілген статистика, скиндер, жарнамасыз.",
      upgrade: "Pro-ға өту"
    },
    about: {
      title: "Қолданба туралы",
      version: "Қолданба нұсқасы",
      privacy: "Құпиялылық саясаты",
      terms: "Пайдалану шарттары",
      bug: "Қате туралы хабарлау",
      export: "Деректерімді экспорттау",
      players: "Барлық ойыншылар",
      todayGames: "Бүгінгі ойындар",
      record: "Күн рекорды",
      share: "Қолданбамен бөлісу"
    }
  }
};

const sectionIcons: Record<SettingsSection, typeof User> = {
  profile: User,
  appearance: Palette,
  game: Monitor,
  notifications: Bell,
  security: Lock,
  subscription: CreditCard,
  about: Info
};

const accentValues = [
  "166 82% 36%",
  "213 94% 55%",
  "262 83% 58%",
  "330 81% 60%",
  "25 95% 53%",
  "142 71% 45%",
  "0 72% 51%",
  "45 93% 47%"
];

export default function SettingsPage() {
  const { locale } = useLanguage();
  const c = copy[locale];
  const [active, setActive] = useState<SettingsSection>("profile");
  const [dirty, setDirty] = useState(false);
  const [avatar, setAvatar] = useState<string>();
  const { setTheme, theme } = useTheme();
  const { toast } = useToast();
  const sections = Object.keys(c.sections) as SettingsSection[];

  function markDirty() {
    setDirty(true);
  }

  function save() {
    setDirty(false);
    toast({ title: c.saved, variant: "success" });
  }

  function reset() {
    setDirty(false);
    toast({ title: c.canceled, variant: "info" });
  }

  return (
    <div className="page-shell space-y-6">
      <div>
        <Badge variant="outline" className="mb-3">{c.badge}</Badge>
        <h1 className="text-4xl font-semibold tracking-tight">{c.title}</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">{c.subtitle}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <Card className="sticky top-24 bg-card/90 shadow-soft backdrop-blur">
            <CardContent className="space-y-1 p-2">
              {sections.map((id) => {
                const Icon = sectionIcons[id];
                return (
                  <button
                    key={id}
                    onClick={() => setActive(id)}
                    className={[
                      "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-all hover:bg-accent",
                      active === id ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                    ].join(" ")}
                  >
                    <Icon className="h-4 w-4" />
                    {c.sections[id]}
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </aside>

        <div className="lg:hidden">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {sections.map((id) => {
              const Icon = sectionIcons[id];
              return (
                <Button key={id} variant={active === id ? "default" : "outline"} size="sm" onClick={() => setActive(id)}>
                  <Icon className="h-4 w-4" />
                  {c.sections[id]}
                </Button>
              );
            })}
          </div>
        </div>

        <motion.main
          key={active}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="space-y-6"
        >
          {active === "profile" ? <ProfileSettings c={c} avatar={avatar} setAvatar={setAvatar} markDirty={markDirty} save={save} /> : null}
          {active === "appearance" ? <AppearanceSettings c={c} theme={theme} setTheme={setTheme} markDirty={markDirty} /> : null}
          {active === "game" ? <GameSettings c={c} markDirty={markDirty} /> : null}
          {active === "notifications" ? <NotificationSettings c={c} /> : null}
          {active === "security" ? <SecuritySettings c={c} /> : null}
          {active === "subscription" ? <SubscriptionSettings c={c} /> : null}
          {active === "about" ? <AboutSettings c={c} /> : null}
        </motion.main>
      </div>

      {dirty ? (
        <div className="sticky bottom-4 z-40 mx-auto flex max-w-3xl items-center justify-between gap-3 rounded-xl border bg-card/95 p-3 shadow-soft backdrop-blur">
          <span className="text-sm text-muted-foreground">{c.unsaved}</span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={reset}>{c.cancel}</Button>
            <Button onClick={save}>
              <Save className="h-4 w-4" />
              {c.save}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ProfileSettings({ c, avatar, setAvatar, markDirty, save }: { c: typeof copy.en; avatar?: string; setAvatar: (value?: string) => void; markDirty: () => void; save: () => void }) {
  const [confirmDelete, setConfirmDelete] = useState("");
  return (
    <Card className="bg-card/90 shadow-soft backdrop-blur">
      <CardHeader>
        <CardTitle>{c.profile.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar className="h-20 w-20 border">
            <AvatarImage src={avatar} />
            <AvatarFallback>{initials("SudokuMind")}</AvatarFallback>
          </Avatar>
          <div className="space-y-2">
            <Input
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                setAvatar(URL.createObjectURL(file));
                markDirty();
              }}
            />
            {avatar ? <Button variant="outline" onClick={() => { setAvatar(undefined); markDirty(); }}>{c.profile.removePhoto}</Button> : null}
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <SettingField label={c.profile.name} defaultValue="Meirzhan" onChange={markDirty} />
          <SettingField label={c.profile.username} defaultValue="meiirzhan04" onChange={markDirty} helper={c.profile.usernameHelp} />
          <SettingField label="Email" defaultValue="user@example.com" onChange={markDirty} helper={c.profile.emailHelp} />
          <SettingField label={c.profile.city} defaultValue="Almaty" onChange={markDirty} />
        </div>
        <Button onClick={save}>{c.profile.saveChanges}</Button>
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4">
          <div className="font-medium text-destructive">{c.profile.danger}</div>
          <p className="mt-1 text-sm text-muted-foreground">{c.profile.deleteHelp}</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Input value={confirmDelete} onChange={(event) => setConfirmDelete(event.target.value)} placeholder={c.profile.deleteWord} />
            <Button variant="destructive" disabled={confirmDelete !== c.profile.deleteWord}>
              <Trash2 className="h-4 w-4" />
              {c.profile.deleteAccount}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AppearanceSettings({ c, theme, setTheme, markDirty }: { c: typeof copy.en; theme?: string; setTheme: (theme: string) => void; markDirty: () => void }) {
  const [cellSize, setCellSize] = useState(2);
  const [animations, setAnimations] = useState(true);
  const [sounds, setSounds] = useState(false);
  return (
    <Card className="bg-card/90 shadow-soft backdrop-blur">
      <CardHeader><CardTitle>{c.appearance.title}</CardTitle></CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 md:grid-cols-3">
          {(["light", "dark", "system"] as const).map((item) => (
            <button
              key={item}
              onClick={() => { setTheme(item); markDirty(); }}
              className={["rounded-lg border p-4 text-start transition-all hover:-translate-y-0.5", theme === item ? "border-primary bg-primary/10" : "bg-background/60"].join(" ")}
            >
              <div className="font-medium">{c.appearance.themes[item]}</div>
              <div className="mt-2 h-16 rounded-md border bg-gradient-to-br from-background to-muted" />
            </button>
          ))}
        </div>
        <div>
          <Label>{c.appearance.accent}</Label>
          <div className="mt-3 flex flex-wrap gap-3">
            {accentValues.map((value, index) => (
              <button
                key={value}
                aria-label={c.appearance.colors[index]}
                className="h-9 w-9 rounded-full border-4 border-background shadow ring-1 ring-border active:scale-95"
                style={{ backgroundColor: `hsl(${value})` }}
                onClick={() => {
                  document.documentElement.style.setProperty("--primary", value);
                  markDirty();
                }}
              />
            ))}
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {c.appearance.digitFont.map((font, index) => (
            <div key={font} className="rounded-lg border bg-background/60 p-4">
              <div className="mb-3 text-sm font-medium">{font}</div>
              <MiniBoard mono={index === 2} />
            </div>
          ))}
        </div>
        <div>
          <Label>{c.appearance.cellSize}</Label>
          <input className="mt-3 w-full" type="range" min={1} max={3} value={cellSize} onChange={(event) => { setCellSize(Number(event.target.value)); markDirty(); }} />
          <div className="mt-2 text-sm text-muted-foreground">{c.appearance.sizes[cellSize - 1]}</div>
        </div>
        <Toggle label={c.appearance.animations} checked={animations} onChange={setAnimations} />
        <Toggle label={c.appearance.sounds} checked={sounds} onChange={setSounds} />
        {sounds ? <input className="w-full" type="range" min={0} max={100} defaultValue={35} /> : null}
        <BoardSkins c={c} />
      </CardContent>
    </Card>
  );
}

function GameSettings({ c, markDirty }: { c: typeof copy.en; markDirty: () => void }) {
  return (
    <Card className="bg-card/90 shadow-soft backdrop-blur">
      <CardHeader><CardTitle>{c.game.title}</CardTitle></CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>{c.game.defaultDifficulty}</Label>
          <Select defaultValue="medium" onValueChange={markDirty}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">{c.game.easy}</SelectItem>
              <SelectItem value="medium">{c.game.medium}</SelectItem>
              <SelectItem value="hard">{c.game.hard}</SelectItem>
              <SelectItem value="expert">{c.game.expert}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Toggle label={c.game.autoPause} defaultChecked />
        <Toggle label={c.game.instantErrors} defaultChecked />
        <Toggle label={c.game.related} defaultChecked />
        <Toggle label={c.game.matching} defaultChecked />
        <Toggle label={c.game.hardcore} />
        <Toggle label={c.game.autoFill} />
        <div className="space-y-2">
          <Label>{c.game.mistakeLimit}</Label>
          <Select defaultValue="3" onValueChange={markDirty}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3</SelectItem>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="unlimited">{c.game.unlimited}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>{c.game.timer}</Label>
          <Select defaultValue="up" onValueChange={markDirty}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="up">{c.game.countUp}</SelectItem>
              <SelectItem value="down">{c.game.countDown}</SelectItem>
              <SelectItem value="hidden">{c.game.hidden}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}

function NotificationSettings({ c }: { c: typeof copy.en }) {
  return (
    <Card className="bg-card/90 shadow-soft backdrop-blur">
      <CardHeader><CardTitle>{c.notifications.title}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <Toggle label={c.notifications.daily} />
        <SettingField label={c.notifications.time} defaultValue="08:00" />
        <Toggle label={c.notifications.streak} defaultChecked />
        <Toggle label={c.notifications.xp} defaultChecked />
        <Toggle label={c.notifications.level} defaultChecked />
        <Toggle label={c.notifications.weekly} />
        <Button variant="outline"><Send className="h-4 w-4" /> {c.notifications.test}</Button>
      </CardContent>
    </Card>
  );
}

function SecuritySettings({ c }: { c: typeof copy.en }) {
  return (
    <div className="space-y-6">
      <Card className="bg-card/90 shadow-soft backdrop-blur">
        <CardHeader><CardTitle>{c.security.title}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <SettingField label={c.security.currentPassword} type="password" />
            <SettingField label={c.security.newPassword} type="password" />
            <SettingField label={c.security.confirmation} type="password" />
          </div>
          <Button>{c.security.changePassword}</Button>
          <div className="rounded-lg border bg-background/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-medium">{c.security.twoFactor}</div>
                <p className="text-sm text-muted-foreground">{c.security.twoFactorHelp}</p>
              </div>
              <Button variant="outline"><ShieldCheck className="h-4 w-4" /> {c.security.enable2fa}</Button>
            </div>
          </div>
          {["Chrome / Almaty", "Safari / iPhone", "Edge / Astana"].map((session, index) => (
            <div key={session} className="flex items-center justify-between rounded-lg border bg-background/60 p-3">
              <div className="flex items-center gap-3">
                {index === 1 ? <Smartphone className="h-4 w-4 text-primary" /> : <Monitor className="h-4 w-4 text-primary" />}
                <div>
                  <div className="font-medium">{session}</div>
                  <div className="text-xs text-muted-foreground">{index === 0 ? c.security.thisDevice : c.security.lastLogin}</div>
                </div>
              </div>
              {index === 0 ? <Badge>{c.security.current}</Badge> : <Button variant="outline" size="sm">{c.security.end}</Button>}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function SubscriptionSettings({ c }: { c: typeof copy.en }) {
  return (
    <Card className="bg-card/90 shadow-soft backdrop-blur">
      <CardHeader><CardTitle>{c.subscription.title}</CardTitle></CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-background/60 p-5">
          <Badge variant="outline">Free</Badge>
          <h3 className="mt-3 text-xl font-semibold">{c.subscription.currentPlan}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{c.subscription.freeText}</p>
        </div>
        <div className="rounded-lg border border-primary/40 bg-primary/5 p-5">
          <Badge>Pro</Badge>
          <h3 className="mt-3 text-xl font-semibold">$4.99/mo</h3>
          <p className="mt-2 text-sm text-muted-foreground">{c.subscription.proText}</p>
          <Button className="mt-4" asChild><Link href="/pro">{c.subscription.upgrade}</Link></Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AboutSettings({ c }: { c: typeof copy.en }) {
  const data = useMemo(() => JSON.stringify({ app: "SudokuMind", exportedAt: new Date().toISOString() }, null, 2), []);
  return (
    <Card className="bg-card/90 shadow-soft backdrop-blur">
      <CardHeader><CardTitle>{c.about.title}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <MiniStat label={c.about.version} value="v1.0.0" />
        <div className="flex flex-wrap gap-2">
          <Button variant="outline">{c.about.privacy}</Button>
          <Button variant="outline">{c.about.terms}</Button>
          <Button variant="outline">{c.about.bug}</Button>
          <Button
            variant="outline"
            onClick={() => {
              const blob = new Blob([data], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = "sudokumind-data.json";
              link.click();
              URL.revokeObjectURL(url);
            }}
          >
            <Download className="h-4 w-4" />
            {c.about.export}
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <MiniStat label={c.about.players} value="1,248" />
          <MiniStat label={c.about.todayGames} value="312" />
          <MiniStat label={c.about.record} value="04:36" />
        </div>
        <Button><Send className="h-4 w-4" /> {c.about.share}</Button>
      </CardContent>
    </Card>
  );
}

function SettingField({ label, defaultValue = "", type = "text", helper, onChange }: { label: string; defaultValue?: string; type?: string; helper?: string; onChange?: () => void }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input type={type} defaultValue={defaultValue} onChange={onChange} />
      {helper ? <p className="text-xs text-muted-foreground">{helper}</p> : null}
    </div>
  );
}

function Toggle({ label, defaultChecked = false, checked, onChange }: { label: string; defaultChecked?: boolean; checked?: boolean; onChange?: (value: boolean) => void }) {
  const [internal, setInternal] = useState(defaultChecked);
  const value = checked ?? internal;
  function toggle() {
    setInternal(!value);
    onChange?.(!value);
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={toggle}
      className="flex min-h-12 w-full items-center justify-between gap-4 rounded-lg border bg-background/60 px-4 py-3 text-left transition-colors hover:bg-accent/40"
    >
      <span className="min-w-0 pr-2 text-sm font-medium leading-5">{label}</span>
      <span className={["relative h-6 w-11 shrink-0 rounded-full transition-colors", value ? "bg-primary" : "bg-muted"].join(" ")}>
        <span className={["absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform", value ? "translate-x-5" : "translate-x-0"].join(" ")} />
      </span>
    </button>
  );
}

function MiniBoard({ mono }: { mono?: boolean }) {
  return (
    <div className={["grid w-24 grid-cols-3 overflow-hidden rounded border", mono ? "font-mono" : ""].join(" ")}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
        <div key={digit} className="flex aspect-square items-center justify-center border bg-background/70 text-sm">{digit}</div>
      ))}
    </div>
  );
}

function BoardSkins({ c }: { c: typeof copy.en }) {
  return (
    <div>
      <Label>{c.appearance.skins}</Label>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        {c.appearance.skinNames.map((skin, index) => (
          <Link key={skin} href={index > 1 ? "/pro" : "#"} className={["rounded-lg border p-4 transition-all hover:-translate-y-0.5", index > 1 ? "blur-[1px]" : "bg-background/60"].join(" ")}>
            <div className="flex items-center justify-between">
              <span className="font-medium">{skin}</span>
              {index > 1 ? <Badge>PRO</Badge> : null}
            </div>
            <div className="mt-3 h-16 rounded-md border bg-gradient-to-br from-primary/20 to-muted" />
          </Link>
        ))}
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border bg-background/60 p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 font-mono text-lg font-semibold">{value}</div>
    </div>
  );
}
