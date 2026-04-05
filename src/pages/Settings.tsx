import { useEffect, useState } from "react";
import { Bell, Globe, Palette, User } from "lucide-react";
import { AppTheme, useAppState } from "@/context/AppStateContext";
import { PLAYBACK_SPEED_OPTIONS } from "@/lib/playbackSpeed";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const notificationOptions = [
  { key: "checkpointReminders", label: "Checkpoint reminders" },
  { key: "streakAlerts", label: "Streak alerts" },
  { key: "weeklySummary", label: "Weekly summary" },
  { key: "releaseNotes", label: "Release notes" },
] as const;

const Settings = () => {
  const { user, theme, setTheme, playbackSpeed, setPlaybackSpeed, updateUser } =
    useAppState();
  const [notifications, setNotifications] = useState({
    checkpointReminders: false,
    streakAlerts: false,
    weeklySummary: false,
    releaseNotes: false,
  });
  const [profileValues, setProfileValues] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
  });
  const [profileErrors, setProfileErrors] = useState<{
    name?: string;
    email?: string;
  }>({});

  useEffect(() => {
    setProfileValues({
      name: user?.name ?? "",
      email: user?.email ?? "",
    });
  }, [user?.email, user?.name]);

  const handleSaveProfile = () => {
    const nextErrors: { name?: string; email?: string } = {};

    if (!profileValues.name.trim()) {
      nextErrors.name = "Display name is required.";
    }

    if (!profileValues.email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!emailPattern.test(profileValues.email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }

    setProfileErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    updateUser(profileValues);
  };

  return (
    <div className="px-4 py-5 lg:px-8">
      <div className="mx-auto flex max-w-[1120px] flex-col gap-4">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Personalize your profile, alerts, and study defaults.
          </p>
        </div>

        <section className="rounded-2xl bg-card p-4 card-shadow">
          <div className="mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold text-foreground">Profile</h2>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-base font-bold text-primary-foreground">
                  {user?.initials ?? "QS"}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {user?.name}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {user?.email}
                  </p>
                  <p className="mt-0.5 text-xs font-medium text-primary">
                    {user?.plan}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Display Name
                  </Label>
                  <Input
                    type="text"
                    value={profileValues.name}
                    onChange={(event) => {
                      setProfileValues((previous) => ({
                        ...previous,
                        name: event.target.value,
                      }));
                      setProfileErrors((previous) => ({
                        ...previous,
                        name: undefined,
                      }));
                    }}
                    className={`mt-1 h-10 rounded-xl ${profileErrors.name ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  />
                  {profileErrors.name && (
                    <p className="mt-1 text-xs text-destructive">
                      {profileErrors.name}
                    </p>
                  )}
                </div>

                <div>
                  <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Email
                  </Label>
                  <Input
                    type="email"
                    value={profileValues.email}
                    onChange={(event) => {
                      setProfileValues((previous) => ({
                        ...previous,
                        email: event.target.value,
                      }));
                      setProfileErrors((previous) => ({
                        ...previous,
                        email: undefined,
                      }));
                    }}
                    className={`mt-1 h-10 rounded-xl ${profileErrors.email ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  />
                  {profileErrors.email && (
                    <p className="mt-1 text-xs text-destructive">
                      {profileErrors.email}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              <button className="rounded-xl border border-border bg-muted/35 p-3 text-left transition-colors hover:bg-muted/60">
                <p className="text-sm font-medium text-foreground">
                  Update password
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Future authenticated flow.
                </p>
              </button>

              <button className="rounded-xl border border-border bg-muted/35 p-3 text-left transition-colors hover:bg-muted/60">
                <p className="text-sm font-medium text-foreground">
                  Export study history
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Package local progress and uploads.
                </p>
              </button>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button
              onClick={handleSaveProfile}
              className="h-10 rounded-xl px-5"
            >
              Save profile
            </Button>
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-3">
          <section className="rounded-2xl bg-card p-4 card-shadow">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-warning" />
                <h2 className="text-sm font-semibold text-foreground">
                  Notifications
                </h2>
              </div>
              <span className="rounded-full border border-border bg-muted px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                In development
              </span>
            </div>

            <div className="space-y-3">
              {notificationOptions.map((notification) => (
                <div
                  key={notification.key}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-muted/30 px-3 py-2.5 opacity-60"
                >
                  <div className="flex flex-col">
                    <Label className="text-sm text-muted-foreground">
                      {notification.label}
                    </Label>
                  </div>
                  <Switch checked={notifications[notification.key]} disabled />
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl bg-card p-4 card-shadow">
            <div className="mb-3 flex items-center gap-2">
              <Palette className="h-5 w-5 text-tertiary" />
              <h2 className="text-sm font-semibold text-foreground">
                Appearance
              </h2>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Theme
                </Label>
                <Select
                  value={theme}
                  onValueChange={(value) => setTheme(value as AppTheme)}
                >
                  <SelectTrigger className="mt-1 h-10 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Language
                </Label>
                <Select value="en" enabled>
                  <SelectTrigger className="mt-1 h-10 rounded-xl opacity-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <section className="rounded-2xl bg-card p-4 card-shadow">
            <div className="mb-3 flex items-center gap-2">
              <Globe className="h-5 w-5 text-secondary" />
              <h2 className="text-sm font-semibold text-foreground">
                Learning Preferences
              </h2>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Playback Speed
                </Label>
                <Select value={playbackSpeed} onValueChange={setPlaybackSpeed}>
                  <SelectTrigger className="mt-1 h-10 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLAYBACK_SPEED_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Checkpoint Style
                </Label>
                <Select value="challenge" enabled>
                  <SelectTrigger className="mt-1 h-10 rounded-xl opacity-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="challenge">Challenge</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Settings;
