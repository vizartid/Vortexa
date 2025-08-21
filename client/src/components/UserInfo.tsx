
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocalStorage, UserData } from "@/lib/localStorage";
import { User, Calendar, MessageSquare, HardDrive, Trash2 } from "lucide-react";

export default function UserInfo() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [storageInfo, setStorageInfo] = useState({ totalSize: 0, itemCount: 0 });
  const [chatCount, setChatCount] = useState(0);
  const localStorage = useLocalStorage();

  useEffect(() => {
    const user = localStorage.getUserData();
    const storage = localStorage.getStorageInfo();
    const chats = localStorage.getChatHistory();
    
    setUserData(user);
    setStorageInfo(storage);
    setChatCount(chats.length);
  }, []);

  const handleClearData = () => {
    if (confirm("Apakah Anda yakin ingin menghapus semua data lokal? Tindakan ini tidak dapat dibatalkan.")) {
      localStorage.clearAll();
      setUserData(localStorage.getUserData());
      setStorageInfo({ totalSize: 0, itemCount: 0 });
      setChatCount(0);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!userData) return null;

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Informasi Pengguna
        </CardTitle>
        <CardDescription>
          Data yang tersimpan di browser Anda
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="text-sm">User ID:</span>
            </div>
            <Badge variant="secondary" className="text-xs font-mono">
              {userData.userId.substring(0, 20)}...
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">Kunjungan:</span>
            </div>
            <Badge variant="outline">
              {userData.visitCount} kali
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span className="text-sm">Chat Tersimpan:</span>
            </div>
            <Badge variant="outline">
              {chatCount} percakapan
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4" />
              <span className="text-sm">Ukuran Data:</span>
            </div>
            <Badge variant="outline">
              {formatBytes(storageInfo.totalSize)}
            </Badge>
          </div>
        </div>

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground mb-2">
            Terakhir kunjungan: {new Date(userData.lastVisit).toLocaleString('id-ID')}
          </p>
          
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={handleClearData}
            className="w-full"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Hapus Semua Data Lokal
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
