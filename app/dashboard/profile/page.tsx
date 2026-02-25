"use client";

import { useSession } from "next-auth/react";
import { User, Shield, Key, Mail, Fingerprint, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function ProfilePage() {
  const { data: session } = useSession();

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Şifreniz başarıyla güncellendi (Demo)");
  };

  return (
    <div className="container mx-auto px-6 py-10 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col gap-1 mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Profil Ayarları
          </h1>
          <p className="text-zinc-500 text-sm">
            Hesap bilgilerinizi ve güvenlik tercihlerinizi buradan yönetin.
          </p>
        </div>

        <Tabs defaultValue="account" className="space-y-6">
          <TabsList className="bg-zinc-900/50 border border-zinc-800 p-1">
            <TabsTrigger value="account" className="gap-2">
              <User className="w-4 h-4" />
              Hesap Bilgileri
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="w-4 h-4" />
              Güvenlik
            </TabsTrigger>
          </TabsList>

          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-white">
                  Genel Bilgiler
                </CardTitle>
                <CardDescription className="text-zinc-500">
                  Sistemdeki temel profil bilgileriniz.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-900/30 border border-zinc-800">
                  <div className="h-12 w-12 rounded-full bg-linear-to-br from-zinc-800 to-zinc-950 border border-zinc-700 flex items-center justify-center shadow-2xl shrink-0">
                    <User className="h-6 w-6 text-zinc-400" />
                  </div>
                  <div className="flex flex-col">
                    <p className="text-base font-bold text-white">
                      {session?.user?.name || "Kullanıcı"}
                    </p>
                    <p className="text-sm text-zinc-500 font-medium">
                      {session?.user?.email}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 mt-8">
                  <div className="space-y-3">
                    <Label htmlFor="name" className="text-zinc-400">
                      Ad Soyad
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-4 h-4 text-zinc-600" />
                      <Input
                        id="name"
                        defaultValue={session?.user?.name || ""}
                        disabled
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="email" className="text-zinc-400">
                      E-posta Adresi
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-zinc-600" />
                      <Input
                        id="email"
                        defaultValue={session?.user?.email || ""}
                        disabled
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-white">
                  Şifre İşlemleri
                </CardTitle>
                <CardDescription className="text-zinc-500">
                  Hesabınızı güvende tutmak için düzenli olarak şifrenizi
                  güncelleyin.
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-4">
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div className="space-y-3">
                    <Label htmlFor="current" className="text-zinc-400">
                      Mevcut Şifre
                    </Label>
                    <div className="relative">
                      <Key className="absolute left-3 top-3 w-4 h-4 text-zinc-600" />
                      <Input
                        id="current"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="new" className="text-zinc-400">
                      Yeni Şifre
                    </Label>
                    <div className="relative">
                      <Key className="absolute left-3 top-3 w-4 h-4 text-zinc-600" />
                      <Input
                        id="new"
                        type="password"
                        placeholder="En az 8 karakter"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="confirm" className="text-zinc-400">
                      Yeni Şifre (Tekrar)
                    </Label>
                    <div className="relative">
                      <Key className="absolute left-3 top-3 w-4 h-4 text-zinc-600" />
                      <Input
                        id="confirm"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full sm:w-auto gap-2 bg-white text-black hover:bg-zinc-200"
                  >
                    <Save className="w-4 h-4" />
                    Şifreyi Güncelle
                  </Button>
                </form>

                <div className="border-t border-zinc-900 pt-4 mt-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-sm font-bold text-white flex items-center gap-2">
                        <Fingerprint className="w-4 h-4 text-zinc-400" />
                        İki Faktörlü Doğrulama
                      </p>
                      <p className="text-xs text-zinc-500 font-medium">
                        Hesabınıza ekstra bir güvenlik katmanı ekleyin.
                      </p>
                    </div>
                    <Button variant="outline" disabled>
                      Yakında
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}
