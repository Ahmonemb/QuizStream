import { useState } from "react";
import { User, Bell, Palette, Shield, Globe, HelpCircle, LogOut } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Settings = () => {
  const [notifications, setNotifications] = useState({
    quizReminders: true,
    streakAlerts: true,
    weeklyDigest: false,
    newFeatures: true,
  });

  const toggleNotif = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="max-w-[720px] mx-auto px-4 py-8 lg:px-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <div className="bg-card rounded-2xl p-6 card-shadow space-y-5">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          <h2 className="text-base font-semibold text-foreground">Profile</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground text-xl font-bold">
            JS
          </div>
          <div>
            <p className="text-base font-semibold text-foreground">Jane Smith</p>
            <p className="text-sm text-muted-foreground">jane.smith@email.com</p>
            <button className="text-xs text-primary font-medium mt-1 hover:underline">Edit Profile</button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Display Name</Label>
            <input
              type="text"
              defaultValue="Jane Smith"
              className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Email</Label>
            <input
              type="email"
              defaultValue="jane.smith@email.com"
              className="mt-1 w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-card rounded-2xl p-6 card-shadow space-y-5">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-warning" />
          <h2 className="text-base font-semibold text-foreground">Notifications</h2>
        </div>
        {[
          { key: "quizReminders" as const, label: "Quiz Reminders", desc: "Get reminded when quizzes are due" },
          { key: "streakAlerts" as const, label: "Streak Alerts", desc: "Don't lose your streak!" },
          { key: "weeklyDigest" as const, label: "Weekly Digest", desc: "Summary of your weekly progress" },
          { key: "newFeatures" as const, label: "New Features", desc: "Be the first to know about updates" },
        ].map((item) => (
          <div key={item.key} className="flex items-center justify-between py-1">
            <div>
              <Label className="text-sm font-medium text-foreground">{item.label}</Label>
              <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
            </div>
            <Switch checked={notifications[item.key]} onCheckedChange={() => toggleNotif(item.key)} />
          </div>
        ))}
      </div>

      {/* Appearance */}
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
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="de">Deutsch</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Learning Preferences */}
      <div className="bg-card rounded-2xl p-6 card-shadow space-y-5">
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-secondary" />
          <h2 className="text-base font-semibold text-foreground">Learning Preferences</h2>
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
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Quiz Difficulty</Label>
            <Select defaultValue="medium">
              <SelectTrigger className="mt-1 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center justify-between py-1">
          <div>
            <Label className="text-sm font-medium text-foreground">Auto-pause on Quiz</Label>
            <p className="text-xs text-muted-foreground mt-0.5">Automatically pause video at checkpoints</p>
          </div>
          <Switch defaultChecked />
        </div>
        <div className="flex items-center justify-between py-1">
          <div>
            <Label className="text-sm font-medium text-foreground">Show Transcript</Label>
            <p className="text-xs text-muted-foreground mt-0.5">Display transcript by default</p>
          </div>
          <Switch defaultChecked />
        </div>
      </div>

      {/* Privacy & Security */}
      <div className="bg-card rounded-2xl p-6 card-shadow space-y-5">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-destructive" />
          <h2 className="text-base font-semibold text-foreground">Privacy & Security</h2>
        </div>
        <div className="space-y-3">
          <button className="w-full text-left p-3 rounded-xl hover:bg-muted/50 transition-colors">
            <p className="text-sm font-medium text-foreground">Change Password</p>
            <p className="text-xs text-muted-foreground">Update your account password</p>
          </button>
          <button className="w-full text-left p-3 rounded-xl hover:bg-muted/50 transition-colors">
            <p className="text-sm font-medium text-foreground">Two-Factor Authentication</p>
            <p className="text-xs text-muted-foreground">Add an extra layer of security</p>
          </button>
          <button className="w-full text-left p-3 rounded-xl hover:bg-muted/50 transition-colors">
            <p className="text-sm font-medium text-foreground">Download My Data</p>
            <p className="text-xs text-muted-foreground">Export all your learning data</p>
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="flex items-center justify-between p-4 rounded-2xl border border-border">
        <div className="flex items-center gap-3">
          <LogOut className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium text-foreground">Sign Out</p>
            <p className="text-xs text-muted-foreground">Log out of your account</p>
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
