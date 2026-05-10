"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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
import { useToast } from "@/components/ui/toast";
import { initials } from "@/lib/utils";

type SettingsSection = "profile" | "appearance" | "game" | "notifications" | "security" | "subscription" | "about";

const sections: Array<{ id: SettingsSection; label: string; icon: typeof User }> = [
  { id: "profile", label: "Профиль", icon: User },
  { id: "appearance", label: "Внешний вид", icon: Palette },
  { id: "game", label: "Игра", icon: Monitor },
  { id: "notifications", label: "Уведомления", icon: Bell },
  { id: "security", label: "Безопасность", icon: Lock },
  { id: "subscription", label: "Подписка", icon: CreditCard },
  { id: "about", label: "О приложении", icon: Info }
];

const accentColors = [
  { name: "Бирюзовый", value: "166 82% 36%" },
  { name: "Синий", value: "213 94% 55%" },
  { name: "Фиолетовый", value: "262 83% 58%" },
  { name: "Розовый", value: "330 81% 60%" },
  { name: "Оранжевый", value: "25 95% 53%" },
  { name: "Зелёный", value: "142 71% 45%" },
  { name: "Красный", value: "0 72% 51%" },
  { name: "Жёлтый", value: "45 93% 47%" }
];

export default function SettingsPage() {
  const [active, setActive] = useState<SettingsSection>("profile");
  const [dirty, setDirty] = useState(false);
  const [avatar, setAvatar] = useState<string>();
  const { setTheme, theme } = useTheme();
  const { toast } = useToast();

  function markDirty() {
    setDirty(true);
  }

  function save() {
    setDirty(false);
    toast({ title: "Сохранено ✓", variant: "success" });
  }

  function reset() {
    setDirty(false);
    toast({ title: "Изменения отменены", variant: "info" });
  }

  return (
    <div className="page-shell space-y-6">
      <div>
        <Badge variant="outline" className="mb-3">Settings</Badge>
        <h1 className="text-4xl font-semibold tracking-tight">Настройки SudokuMind</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">Все игровые и визуальные настройки применяются мгновенно. Аккаунтные поля сохраняются явно.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <Card className="sticky top-24 bg-card/90 shadow-soft backdrop-blur">
            <CardContent className="space-y-1 p-2">
              {sections.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActive(item.id)}
                  className={[
                    "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-all hover:bg-accent",
                    active === item.id ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                  ].join(" ")}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </button>
              ))}
            </CardContent>
          </Card>
        </aside>

        <div className="lg:hidden">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {sections.map((item) => (
              <Button key={item.id} variant={active === item.id ? "default" : "outline"} size="sm" onClick={() => setActive(item.id)}>
                <item.icon className="h-4 w-4" />
                {item.label}
              </Button>
            ))}
          </div>
        </div>

        <motion.main
          key={active}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15 }}
          className="space-y-6"
        >
          {active === "profile" ? <ProfileSettings avatar={avatar} setAvatar={setAvatar} markDirty={markDirty} save={save} /> : null}
          {active === "appearance" ? <AppearanceSettings theme={theme} setTheme={setTheme} markDirty={markDirty} /> : null}
          {active === "game" ? <GameSettings markDirty={markDirty} /> : null}
          {active === "notifications" ? <NotificationSettings /> : null}
          {active === "security" ? <SecuritySettings /> : null}
          {active === "subscription" ? <SubscriptionSettings /> : null}
          {active === "about" ? <AboutSettings /> : null}
        </motion.main>
      </div>

      {dirty ? (
        <div className="sticky bottom-4 z-40 mx-auto flex max-w-3xl items-center justify-between gap-3 rounded-xl border bg-card/95 p-3 shadow-soft backdrop-blur">
          <span className="text-sm text-muted-foreground">У вас есть несохранённые изменения</span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={reset}>Отменить</Button>
            <Button onClick={save}>
              <Save className="h-4 w-4" />
              Сохранить
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ProfileSettings({ avatar, setAvatar, markDirty, save }: { avatar?: string; setAvatar: (value?: string) => void; markDirty: () => void; save: () => void }) {
  const [confirmDelete, setConfirmDelete] = useState("");
  return (
    <Card className="bg-card/90 shadow-soft backdrop-blur">
      <CardHeader>
        <CardTitle>👤 Профиль</CardTitle>
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
            {avatar ? <Button variant="outline" onClick={() => { setAvatar(undefined); markDirty(); }}>Удалить фото</Button> : null}
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <SettingField label="Имя" defaultValue="Meirzhan" onChange={markDirty} />
          <SettingField label="Username" defaultValue="meiirzhan04" onChange={markDirty} helper="Проверка занятости через debounce-ready API." />
          <SettingField label="Email" defaultValue="user@example.com" onChange={markDirty} helper="При изменении будет отправлено письмо подтверждения." />
          <SettingField label="Город" defaultValue="Almaty" onChange={markDirty} />
        </div>
        <Button onClick={save}>Сохранить изменения</Button>
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4">
          <div className="font-medium text-destructive">Опасная зона</div>
          <p className="mt-1 text-sm text-muted-foreground">Введите УДАЛИТЬ для подтверждения удаления аккаунта.</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Input value={confirmDelete} onChange={(event) => setConfirmDelete(event.target.value)} placeholder="УДАЛИТЬ" />
            <Button variant="destructive" disabled={confirmDelete !== "УДАЛИТЬ"}>
              <Trash2 className="h-4 w-4" />
              Удалить аккаунт
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AppearanceSettings({ theme, setTheme, markDirty }: { theme?: string; setTheme: (theme: string) => void; markDirty: () => void }) {
  const [cellSize, setCellSize] = useState(2);
  const [animations, setAnimations] = useState(true);
  const [sounds, setSounds] = useState(false);
  return (
    <div className="space-y-6">
      <Card className="bg-card/90 shadow-soft backdrop-blur">
        <CardHeader><CardTitle>🎨 Внешний вид</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-3 md:grid-cols-3">
            {["light", "dark", "system"].map((item) => (
              <button
                key={item}
                onClick={() => { setTheme(item); markDirty(); }}
                className={["rounded-lg border p-4 text-start transition-all hover:-translate-y-0.5", theme === item ? "border-primary bg-primary/10" : "bg-background/60"].join(" ")}
              >
                <div className="font-medium">{item === "light" ? "Светлая" : item === "dark" ? "Тёмная" : "Системная"}</div>
                <div className="mt-2 h-16 rounded-md border bg-gradient-to-br from-background to-muted" />
              </button>
            ))}
          </div>
          <div>
            <Label>Акцентный цвет</Label>
            <div className="mt-3 flex flex-wrap gap-3">
              {accentColors.map((color) => (
                <button
                  key={color.name}
                  aria-label={color.name}
                  className="h-9 w-9 rounded-full border-4 border-background shadow ring-1 ring-border active:scale-95"
                  style={{ backgroundColor: `hsl(${color.value})` }}
                  onClick={() => {
                    document.documentElement.style.setProperty("--primary", color.value);
                    markDirty();
                  }}
                />
              ))}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {["Стандартный", "Округлый", "Моноширинный"].map((font) => (
              <div key={font} className="rounded-lg border bg-background/60 p-4">
                <div className="mb-3 text-sm font-medium">{font}</div>
                <MiniBoard mono={font === "Моноширинный"} />
              </div>
            ))}
          </div>
          <div>
            <Label>Размер ячеек</Label>
            <input className="mt-3 w-full" type="range" min={1} max={3} value={cellSize} onChange={(event) => { setCellSize(Number(event.target.value)); markDirty(); }} />
            <div className="mt-2 text-sm text-muted-foreground">{["Маленький", "Средний", "Большой"][cellSize - 1]}</div>
          </div>
          <Toggle label="Включить анимации" checked={animations} onChange={setAnimations} />
          <Toggle label="Звуковые эффекты" checked={sounds} onChange={setSounds} />
          {sounds ? <input className="w-full" type="range" min={0} max={100} defaultValue={35} /> : null}
          <BoardSkins />
        </CardContent>
      </Card>
    </div>
  );
}

function GameSettings({ markDirty }: { markDirty: () => void }) {
  return (
    <Card className="bg-card/90 shadow-soft backdrop-blur">
      <CardHeader><CardTitle>🎮 Игра</CardTitle></CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Сложность по умолчанию</Label>
          <Select defaultValue="medium" onValueChange={markDirty}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">Лёгкий</SelectItem>
              <SelectItem value="medium">Средний</SelectItem>
              <SelectItem value="hard">Сложный</SelectItem>
              <SelectItem value="expert">Эксперт</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Toggle label="Автопауза при сворачивании вкладки" defaultChecked />
        <Toggle label="Подсветка ошибок сразу" defaultChecked />
        <Toggle label="Подсветка связанных ячеек" defaultChecked />
        <Toggle label="Подсветка одинаковых цифр" defaultChecked />
        <Toggle label="Режим хардкор" />
        <Toggle label="Автозаполнение последней цифры" />
        <div className="space-y-2">
          <Label>Лимит ошибок</Label>
          <Select defaultValue="3" onValueChange={markDirty}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3</SelectItem>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="unlimited">Безлимит</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Таймер</Label>
          <Select defaultValue="up" onValueChange={markDirty}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="up">Считать вверх</SelectItem>
              <SelectItem value="down">Считать вниз</SelectItem>
              <SelectItem value="hidden">Скрыть</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}

function NotificationSettings() {
  return (
    <Card className="bg-card/90 shadow-soft backdrop-blur">
      <CardHeader><CardTitle>🔔 Уведомления</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <Toggle label="Ежедневное напоминание" />
        <SettingField label="Время напоминания" defaultValue="08:00" />
        <Toggle label="Напомнить о стрике" defaultChecked />
        <Toggle label="XP достижения" defaultChecked />
        <Toggle label="Новый уровень" defaultChecked />
        <Toggle label="Еженедельный отчёт на email" />
        <Button variant="outline"><Send className="h-4 w-4" /> Проверить уведомление</Button>
      </CardContent>
    </Card>
  );
}

function SecuritySettings() {
  return (
    <div className="space-y-6">
      <Card className="bg-card/90 shadow-soft backdrop-blur">
        <CardHeader><CardTitle>🔒 Безопасность</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <SettingField label="Текущий пароль" type="password" />
            <SettingField label="Новый пароль" type="password" />
            <SettingField label="Подтверждение" type="password" />
          </div>
          <Button>Изменить пароль</Button>
          <div className="rounded-lg border bg-background/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-medium">Двухфакторная аутентификация</div>
                <p className="text-sm text-muted-foreground">Выключена. QR-code flow готов для backend подключения.</p>
              </div>
              <Button variant="outline"><ShieldCheck className="h-4 w-4" /> Включить 2FA</Button>
            </div>
          </div>
          {["Chrome / Almaty", "Safari / iPhone", "Edge / Astana"].map((session, index) => (
            <div key={session} className="flex items-center justify-between rounded-lg border bg-background/60 p-3">
              <div className="flex items-center gap-3">
                {index === 1 ? <Smartphone className="h-4 w-4 text-primary" /> : <Monitor className="h-4 w-4 text-primary" />}
                <div>
                  <div className="font-medium">{session}</div>
                  <div className="text-xs text-muted-foreground">{index === 0 ? "Это вы сейчас" : "Последний вход недавно"}</div>
                </div>
              </div>
              {index === 0 ? <Badge>Current</Badge> : <Button variant="outline" size="sm">Завершить</Button>}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function SubscriptionSettings() {
  return (
    <Card className="bg-card/90 shadow-soft backdrop-blur">
      <CardHeader><CardTitle>💎 Подписка</CardTitle></CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-background/60 p-5">
          <Badge variant="outline">Free</Badge>
          <h3 className="mt-3 text-xl font-semibold">Текущий план</h3>
          <p className="mt-2 text-sm text-muted-foreground">3 hints в день, basic statistics, classic board.</p>
        </div>
        <div className="rounded-lg border border-primary/40 bg-primary/5 p-5">
          <Badge>Pro</Badge>
          <h3 className="mt-3 text-xl font-semibold">$4.99/мес</h3>
          <p className="mt-2 text-sm text-muted-foreground">Unlimited hints, AI Coach, advanced stats, skins, no ads.</p>
          <Button className="mt-4" asChild><Link href="/pro">Перейти на Pro</Link></Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AboutSettings() {
  const data = useMemo(() => JSON.stringify({ app: "SudokuMind", exportedAt: new Date().toISOString() }, null, 2), []);
  return (
    <Card className="bg-card/90 shadow-soft backdrop-blur">
      <CardHeader><CardTitle>ℹ️ О приложении</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <MiniStat label="Версия приложения" value="v1.0.0" />
        <div className="flex flex-wrap gap-2">
          <Button variant="outline">Политика конфиденциальности</Button>
          <Button variant="outline">Условия использования</Button>
          <Button variant="outline">Сообщить об ошибке</Button>
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
            Экспортировать мои данные
          </Button>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <MiniStat label="Всего игроков" value="1,248" />
          <MiniStat label="Игр сегодня" value="312" />
          <MiniStat label="Рекорд дня" value="04:36" />
        </div>
        <Button><Send className="h-4 w-4" /> Поделиться приложением</Button>
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
  return (
    <label className="flex items-center justify-between gap-3 rounded-lg border bg-background/60 p-3">
      <span className="text-sm font-medium">{label}</span>
      <button
        type="button"
        onClick={() => {
          setInternal(!value);
          onChange?.(!value);
        }}
        className={["relative h-6 w-11 rounded-full transition-colors", value ? "bg-primary" : "bg-muted"].join(" ")}
      >
        <span className={["absolute top-1 h-4 w-4 rounded-full bg-white transition-transform", value ? "translate-x-5" : "translate-x-1"].join(" ")} />
      </button>
    </label>
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

function BoardSkins() {
  return (
    <div>
      <Label>Скины доски</Label>
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        {["Классический", "Дерево", "Минимал", "Неон", "Бумага", "Ночной"].map((skin, index) => (
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
