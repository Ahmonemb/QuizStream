import { useEffect, useState } from "react";
import { Bell, Globe, Palette, User } from "lucide-react";
import { AppTheme, useAppState } from "@/context/AppStateContext";
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
  const { user, theme, setTheme, updateUser } = useAppState();
  const [notifications, setNotifications] = useState({
    checkpointReminders: true,
    streakAlerts: true,
    weeklySummary: true,
    releaseNotes: false,
  });
  const [learningPreferences, setLearningPreferences] = useState({
    autoPauseAtCheckpoint: true,
    openTranscriptByDefault: true,
  });
  const [profileValues, setProfileValues] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
  });
  const [profileErrors, setProfileErrors] = useState<{ name?: string; email?: string }>({});

  useEffect(() => {
    setProfileValues({
      name: user?.name ?? "",
      email: user?.email ?? "",
    });
  }, [user?.email, user?.name]);

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications((previous) => ({ ...previous, [key]: !previous[key] }));
  };

  const toggleLearningPreference = (key: keyof typeof learningPreferences) => {
    setLearningPreferences((previous) => ({ ...previous, [key]: !previous[key] }));
  };

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
                  <p className="truncate text-sm font-semibold text-foreground">{user?.name}</p>
                  <p className="truncate text-sm text-muted-foreground">{user?.email}</p>
                  <p className="mt-0.5 text-xs font-medium text-primary">{user?.plan}</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Display Name</Label>
                  <Input
                    type="text"
                    value={profileValues.name}
                    onChange={(event) => {
                      setProfileValues((previous) => ({ ...previous, name: event.target.value }));
                      setProfileErrors((previous) => ({ ...previous, name: undefined }));
                    }}
                    className={`mt-1 h-10 rounded-xl ${profileErrors.name ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  />
                  {profileErrors.name && <p className="mt-1 text-xs text-destructive">{profileErrors.name}</p>}
                </div>

                <div>
                  <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Email</Label>
                  <Input
                    type="email"
                    value={profileValues.email}
                    onChange={(event) => {
                      setProfileValues((previous) => ({ ...previous, email: event.target.value }));
                      setProfileErrors((previous) => ({ ...previous, email: undefined }));
                    }}
                    className={`mt-1 h-10 rounded-xl ${profileErrors.email ? "border-destructive focus-visible:ring-destructive" : ""}`}
                  />
                  {profileErrors.email && <p className="mt-1 text-xs text-destructive">{profileErrors.email}</p>}
                </div>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              <button className="rounded-xl border border-border bg-muted/35 p-3 text-left transition-colors hover:bg-muted/60">
                <p className="text-sm font-medium text-foreground">Update password</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Future authenticated flow.</p>
              </button>

              <button className="rounded-xl border border-border bg-muted/35 p-3 text-left transition-colors hover:bg-muted/60">
                <p className="text-sm font-medium text-foreground">Export study history</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Package local progress and uploads.</p>
              </button>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <Button onClick={handleSaveProfile} className="h-10 rounded-xl px-5">
              Save profile
            </Button>
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-3">
          <section className="rounded-2xl bg-card p-4 card-shadow">
            <div className="mb-3 flex items-center gap-2">
              <Bell className="h-5 w-5 text-warning" />
              <h2 className="text-sm font-semibold text-foreground">Notifications</h2>
            </div>

            <div className="space-y-3">
              {notificationOptions.map((notification) => (
                <div key={notification.key} className="flex items-center justify-between gap-3">
                  <Label className="text-sm text-foreground">{notification.label}</Label>
                  <Switch
                    checked={notifications[notification.key]}
                    onCheckedChange={() => toggleNotification(notification.key)}
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl bg-card p-4 card-shadow">
            <div className="mb-3 flex items-center gap-2">
              <Palette className="h-5 w-5 text-tertiary" />
              <h2 className="text-sm font-semibold text-foreground">Appearance</h2>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Theme</Label>
                <Select value={theme} onValueChange={(value) => setTheme(value as AppTheme)}>
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
                <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Language</Label>
                <Select defaultValue="en">
                  <SelectTrigger className="mt-1 h-10 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </section>

          <section className="rounded-2xl bg-card p-4 card-shadow">
            <div className="mb-3 flex items-center gap-2">
              <Globe className="h-5 w-5 text-secondary" />
              <h2 className="text-sm font-semibold text-foreground">Learning Preferences</h2>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Playback Speed</Label>
                <Select defaultValue="1x">
                  <SelectTrigger className="mt-1 h-10 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.5x">0.5x</SelectItem>
                    <SelectItem value="0.75x">0.75x</SelectItem>
                    <SelectItem value="1x">1x</SelectItem>
                    <SelectItem value="1.25x">1.25x</SelectItem>
                    <SelectItem value="1.5x">1.5x</SelectItem>
                    <SelectItem value="2x">2x</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Checkpoint Style</Label>
                <Select defaultValue="balanced">
                  <SelectTrigger className="mt-1 h-10 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="guided">Guided</SelectItem>
                    <SelectItem value="balanced">Balanced</SelectItem>
                    <SelectItem value="challenge">Challenge</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between gap-3">
                <Label className="text-sm text-foreground">Auto-pause</Label>
                <Switch
                  checked={learningPreferences.autoPauseAtCheckpoint}
                  onCheckedChange={() => toggleLearningPreference("autoPauseAtCheckpoint")}
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <Label className="text-sm text-foreground">Show context</Label>
                <Switch
                  checked={learningPreferences.openTranscriptByDefault}
                  onCheckedChange={() => toggleLearningPreference("openTranscriptByDefault")}
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Settings;
