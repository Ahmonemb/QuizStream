import { useState } from "react";
import { User, Bell, Palette, Shield, Globe, HelpCircle, LogOut } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { learnerProfile } from "@/data/courseData";

const Settings = () => {
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

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications((previousNotifications) => ({ ...previousNotifications, [key]: !previousNotifications[key] }));
  };

  const toggleLearningPreference = (key: keyof typeof learningPreferences) => {
    setLearningPreferences((previousPreferences) => ({ ...previousPreferences, [key]: !previousPreferences[key] }));
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
          <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground text-xl font-bold">
            {learnerProfile.initials}
          </div>
          <div>
            <p className="text-base font-semibold text-foreground">{learnerProfile.name}</p>
            <p className="text-sm text-muted-foreground">{learnerProfile.email}</p>
            <button className="text-xs text-primary font-medium mt-1 hover:underline">Manage workspace profile</button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Display Name</Label>
            <Input type="text" defaultValue={learnerProfile.name} className="mt-1 rounded-xl" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Email</Label>
            <Input type="email" defaultValue={learnerProfile.email} className="mt-1 rounded-xl" />
          </div>
        </div>
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
              <p className="text-xs text-muted-foreground mt-0.5">{notification.description}</p>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Theme</Label>
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
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Language</Label>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Playback Speed</Label>
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
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Checkpoint Style</Label>
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
            <p className="text-xs text-muted-foreground mt-0.5">Pause the lesson when QuizStream surfaces a question.</p>
          </div>
          <Switch checked={learningPreferences.autoPauseAtCheckpoint} onCheckedChange={() => toggleLearningPreference("autoPauseAtCheckpoint")} />
        </div>
        <div className="flex items-center justify-between py-1">
          <div>
            <Label className="text-sm font-medium text-foreground">Open transcript by default</Label>
            <p className="text-xs text-muted-foreground mt-0.5">Keep transcript and notes visible beside the lesson.</p>
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
          <button className="w-full text-left p-3 rounded-xl hover:bg-muted/50 transition-colors">
            <p className="text-sm font-medium text-foreground">Update password</p>
            <p className="text-xs text-muted-foreground">Change the password for your QuizStream login.</p>
          </button>
          <button className="w-full text-left p-3 rounded-xl hover:bg-muted/50 transition-colors">
            <p className="text-sm font-medium text-foreground">Two-factor authentication</p>
            <p className="text-xs text-muted-foreground">Add a second step before opening your learning workspace.</p>
          </button>
          <button className="w-full text-left p-3 rounded-xl hover:bg-muted/50 transition-colors">
            <p className="text-sm font-medium text-foreground">Export study history</p>
            <p className="text-xs text-muted-foreground">Download progress, notes, and checkpoint performance.</p>
          </button>
        </div>
      </div>

      <div className="bg-card rounded-2xl p-6 card-shadow space-y-5">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-base font-semibold text-foreground">Help</h2>
        </div>
        <div className="space-y-3">
          <button className="w-full text-left p-3 rounded-xl hover:bg-muted/50 transition-colors">
            <p className="text-sm font-medium text-foreground">View onboarding tips</p>
            <p className="text-xs text-muted-foreground">See how QuizStream places checkpoints and review prompts.</p>
          </button>
          <button className="w-full text-left p-3 rounded-xl hover:bg-muted/50 transition-colors">
            <p className="text-sm font-medium text-foreground">Contact support</p>
            <p className="text-xs text-muted-foreground">Reach the product team if a lesson or quiz needs a fix.</p>
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between p-4 rounded-2xl border border-border">
        <div className="flex items-center gap-3">
          <LogOut className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-foreground">Sign Out</p>
            <p className="text-xs text-muted-foreground">Sign out of this QuizStream workspace.</p>
          </div>
        </div>
        <button className="px-4 py-2 rounded-xl border border-destructive/30 text-destructive text-sm font-medium hover:bg-destructive/10 transition-colors">
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Settings;
