import { useEffect, useState } from "react";
import { User, Bell, Palette, Shield, Globe, HelpCircle, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
import { useAppState } from "@/context/AppStateContext";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Settings = () => {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAppState();
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
    setLearningPreferences((previousPreferences) => ({ ...previousPreferences, [key]: !previousPreferences[key] }));
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

  const handleLogout = () => {
    logout();
    navigate("/welcome", { replace: true });
  };

  return (
    <div className="max-w-[720px] mx-auto px-4 py-8 lg:px-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your QuizStream workspace and study preferences.</p>
      </div>

      <div className="bg-card rounded-2xl p-6 card-shadow space-y-5">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold text-foreground">Profile</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground">
            {user?.initials ?? "QS"}
          </div>
          <div>
            <p className="text-base font-semibold text-foreground">{user?.name}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <p className="mt-1 text-xs font-medium text-primary">{user?.plan}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
        <Button onClick={handleSaveProfile} className="rounded-xl">Save profile</Button>
      </div>

      <div className="bg-card rounded-2xl p-6 card-shadow space-y-5">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-warning" />
          <h2 className="text-base font-semibold text-foreground">Notifications</h2>
        </div>
        {[
          { key: "checkpointReminders" as const, label: "Checkpoint reminders", description: "Get nudges when a saved review session is due." },
          { key: "streakAlerts" as const, label: "Streak alerts", description: "Receive a same-day reminder before your streak expires." },
          { key: "weeklySummary" as const, label: "Weekly summary", description: "See your watch time, accuracy, and review queue every Friday." },
          { key: "releaseNotes" as const, label: "Release notes", description: "Learn when QuizStream ships new learning tools." },
        ].map((notification) => (
          <div key={notification.key} className="flex items-center justify-between py-1">
            <div>
              <Label className="text-sm font-medium text-foreground">{notification.label}</Label>
              <p className="mt-0.5 text-xs text-muted-foreground">{notification.description}</p>
            </div>
            <Switch checked={notifications[notification.key]} onCheckedChange={() => toggleNotification(notification.key)} />
          </div>
        ))}
      </div>

      <div className="bg-card rounded-2xl p-6 card-shadow space-y-5">
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-tertiary" />
          <h2 className="text-base font-semibold text-foreground">Appearance</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Theme</Label>
            <Select defaultValue="light">
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

      <div className="bg-card rounded-2xl p-6 card-shadow space-y-5">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-secondary" />
          <h2 className="text-base font-semibold text-foreground">Learning preferences</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
        <div className="flex items-center justify-between py-1">
          <div>
            <Label className="text-sm font-medium text-foreground">Auto-pause at checkpoint</Label>
            <p className="mt-0.5 text-xs text-muted-foreground">Pause the lesson when QuizStream surfaces a question.</p>
          </div>
          <Switch checked={learningPreferences.autoPauseAtCheckpoint} onCheckedChange={() => toggleLearningPreference("autoPauseAtCheckpoint")} />
        </div>
        <div className="flex items-center justify-between py-1">
          <div>
            <Label className="text-sm font-medium text-foreground">Open transcript by default</Label>
            <p className="mt-0.5 text-xs text-muted-foreground">Keep transcript and notes visible beside the lesson.</p>
          </div>
          <Switch checked={learningPreferences.openTranscriptByDefault} onCheckedChange={() => toggleLearningPreference("openTranscriptByDefault")} />
        </div>
      </div>

      <div className="bg-card rounded-2xl p-6 card-shadow space-y-5">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-destructive" />
          <h2 className="text-base font-semibold text-foreground">Privacy & Security</h2>
        </div>
        <div className="space-y-3">
          <button className="w-full rounded-xl p-3 text-left transition-colors hover:bg-muted/50">
            <p className="text-sm font-medium text-foreground">Update password</p>
            <p className="text-xs text-muted-foreground">Reserved for a future authenticated version of QuizStream.</p>
          </button>
          <button className="w-full rounded-xl p-3 text-left transition-colors hover:bg-muted/50">
            <p className="text-sm font-medium text-foreground">Two-factor authentication</p>
            <p className="text-xs text-muted-foreground">Reserved for a future authenticated version of QuizStream.</p>
          </button>
          <button className="w-full rounded-xl p-3 text-left transition-colors hover:bg-muted/50">
            <p className="text-sm font-medium text-foreground">Export study history</p>
            <p className="text-xs text-muted-foreground">Use local uploads and profile data to power future exports.</p>
          </button>
        </div>
      </div>

      <div className="bg-card rounded-2xl p-6 card-shadow space-y-5">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-base font-semibold text-foreground">Help</h2>
        </div>
        <div className="space-y-3">
          <button className="w-full rounded-xl p-3 text-left transition-colors hover:bg-muted/50">
            <p className="text-sm font-medium text-foreground">View onboarding tips</p>
            <p className="text-xs text-muted-foreground">See how QuizStream personalizes your lessons after you create a profile.</p>
          </button>
          <button className="w-full rounded-xl p-3 text-left transition-colors hover:bg-muted/50">
            <p className="text-sm font-medium text-foreground">Contact support</p>
            <p className="text-xs text-muted-foreground">Reach the product team if a lesson or quiz needs a fix.</p>
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-border p-4">
        <div className="flex items-center gap-3">
          <LogOut className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-foreground">Reset local profile</p>
            <p className="text-xs text-muted-foreground">Clear the saved user and return to the QuizStream welcome screen.</p>
          </div>
        </div>
        <Button variant="outline" onClick={handleLogout} className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive">
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default Settings;
