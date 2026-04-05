import { useEffect, useState } from "react";
import { User, Bell, Palette, Globe } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AppTheme, useAppState } from "@/context/AppStateContext";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
    setNotifications((previousNotifications) => ({ ...previousNotifications, [key]: !previousNotifications[key] }));
  };

  const toggleLearningPreference = (key: keyof typeof learningPreferences) => {
    setLearningPreferences((previousPreferences) => ({
      ...previousPreferences,
      [key]: !previousPreferences[key],
    }));
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
    <div className="mx-auto max-w-[1380px] space-y-4 px-4 py-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Fine-tune your QuizStream workspace and study preferences.
        </p>
      </div>

      <div className="rounded-2xl bg-card p-5 card-shadow space-y-4">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold text-foreground">Profile</h2>
        </div>

        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 flex-1 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-primary-foreground">
                {user?.initials ?? "QS"}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{user?.name}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <p className="mt-0.5 text-xs font-medium text-primary">{user?.plan}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Display Name</Label>
                <Input
                  type="text"
                  value={profileValues.name}
                  onChange={(event) => {
                    setProfileValues((previous) => ({ ...previous, name: event.target.value }));
                    setProfileErrors((previous) => ({ ...previous, name: undefined }));
                  }}
                  className={`mt-1 rounded-xl ${profileErrors.name ? "border-destructive focus-visible:ring-destructive" : ""}`}
                />
                {profileErrors.name && <p className="mt-1 text-sm text-destructive">{profileErrors.name}</p>}
              </div>

              <div>
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Email</Label>
                <Input
                  type="email"
                  value={profileValues.email}
                  onChange={(event) => {
                    setProfileValues((previous) => ({ ...previous, email: event.target.value }));
                    setProfileErrors((previous) => ({ ...previous, email: undefined }));
                  }}
                  className={`mt-1 rounded-xl ${profileErrors.email ? "border-destructive focus-visible:ring-destructive" : ""}`}
                />
                {profileErrors.email && <p className="mt-1 text-sm text-destructive">{profileErrors.email}</p>}
              </div>
            </div>

            <Button onClick={handleSaveProfile} className="rounded-xl">
              Save profile
            </Button>
          </div>

          <div className="xl:w-[320px]">
            <div className="space-y-2 rounded-2xl border border-border bg-muted/35 p-3">
              <button className="w-full rounded-xl p-3 text-left transition-colors hover:bg-muted/70">
                <p className="text-sm font-medium text-foreground">Update password</p>
                <p className="text-xs text-muted-foreground">
                  Reserved for a future authenticated version of QuizStream.
                </p>
              </button>

              <button className="w-full rounded-xl p-3 text-left transition-colors hover:bg-muted/70">
                <p className="text-sm font-medium text-foreground">Export study history</p>
                <p className="text-xs text-muted-foreground">
                  Package local uploads and learning progress for future exports.
                </p>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="-mx-1 overflow-x-auto pb-2">
        <div className="flex min-w-max gap-4 px-1">
          <div className="w-[300px] rounded-2xl bg-card p-5 card-shadow space-y-4">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-warning" />
              <h2 className="text-base font-semibold text-foreground">Notifications</h2>
            </div>

            {[
              {
                key: "checkpointReminders" as const,
                label: "Checkpoint reminders",
                description: "Nudges when a saved review session is due.",
              },
              {
                key: "streakAlerts" as const,
                label: "Streak alerts",
                description: "A same-day reminder before your streak expires.",
              },
              {
                key: "weeklySummary" as const,
                label: "Weekly summary",
                description: "A Friday recap of watch time and accuracy.",
              },
              {
                key: "releaseNotes" as const,
                label: "Release notes",
                description: "Product updates from the QuizStream team.",
              },
            ].map((notification) => (
              <div key={notification.key} className="flex items-start justify-between gap-3 py-0.5">
                <div>
                  <Label className="text-sm font-medium text-foreground">{notification.label}</Label>
                  <p className="mt-0.5 text-xs text-muted-foreground">{notification.description}</p>
                </div>
                <Switch
                  checked={notifications[notification.key]}
                  onCheckedChange={() => toggleNotification(notification.key)}
                />
              </div>
            ))}
          </div>

          <div className="w-[280px] rounded-2xl bg-card p-5 card-shadow space-y-4">
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-tertiary" />
              <h2 className="text-base font-semibold text-foreground">Appearance</h2>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div>
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Theme</Label>
                <Select value={theme} onValueChange={(value) => setTheme(value as AppTheme)}>
                  <SelectTrigger className="mt-1 rounded-xl">
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
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Language</Label>
                <Select defaultValue="en">
                  <SelectTrigger className="mt-1 rounded-xl">
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
          </div>

          <div className="w-[340px] rounded-2xl bg-card p-5 card-shadow space-y-4">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-secondary" />
              <h2 className="text-base font-semibold text-foreground">Learning preferences</h2>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div>
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Playback Speed</Label>
                <Select defaultValue="1x">
                  <SelectTrigger className="mt-1 rounded-xl">
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
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Checkpoint Style</Label>
                <Select defaultValue="balanced">
                  <SelectTrigger className="mt-1 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="guided">Guided</SelectItem>
                    <SelectItem value="balanced">Balanced</SelectItem>
                    <SelectItem value="challenge">Challenge</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-start justify-between gap-3 py-0.5">
              <div>
                <Label className="text-sm font-medium text-foreground">Auto-pause at checkpoint</Label>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Pause the lesson when QuizStream surfaces a question.
                </p>
              </div>
              <Switch
                checked={learningPreferences.autoPauseAtCheckpoint}
                onCheckedChange={() => toggleLearningPreference("autoPauseAtCheckpoint")}
              />
            </div>

            <div className="flex items-start justify-between gap-3 py-0.5">
              <div>
                <Label className="text-sm font-medium text-foreground">Show checkpoint context</Label>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Keep supporting cues visible around the active lesson.
                </p>
              </div>
              <Switch
                checked={learningPreferences.openTranscriptByDefault}
                onCheckedChange={() => toggleLearningPreference("openTranscriptByDefault")}
              />
            </div>
          </div>

      </div>
      </div>
    </div>
  );
};

export default Settings;
