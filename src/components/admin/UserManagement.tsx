import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Camera, Upload, UserPlus, Trash2 } from "lucide-react";
import { api } from "@/lib/api";

interface User {
  user_id: string;
  name: string;
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("");
  const [captureMode, setCaptureMode] = useState<"upload" | "camera">("upload");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(api("/api/admin/users"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCapturing(true);
      }
    } catch (error) {
      toast({
        title: "Camera Error",
        description: "Failed to access camera",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setIsCapturing(false);
    }
  };

  const captureImage = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(videoRef.current, 0, 0);
    
    const imageData = canvas.toDataURL("image/jpeg");
    setCapturedImages((prev) => [...prev, imageData]);
    
    toast({
      title: "Image Captured",
      description: `Captured ${capturedImages.length + 1} images`,
    });
  };

  const handleAddUser = async () => {
    if (!userId || !userName) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("user_id", userId);
    formData.append("name", userName);

    if (captureMode === "upload") {
      if (selectedFiles.length === 0) {
        toast({
          title: "No Images",
          description: "Please upload at least one image",
          variant: "destructive",
        });
        return;
      }
      selectedFiles.forEach((file) => {
        formData.append("images", file);
      });
    } else {
      if (capturedImages.length === 0) {
        toast({
          title: "No Images",
          description: "Please capture at least one image",
          variant: "destructive",
        });
        return;
      }
      capturedImages.forEach((imageData, index) => {
        const blob = dataURItoBlob(imageData);
        formData.append("images", blob, `capture_${index}.jpg`);
      });
    }

    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(api("/api/admin/users"), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "User added successfully",
        });
        fetchUsers();
        setUserId("");
        setUserName("");
        setSelectedFiles([]);
        setCapturedImages([]);
        stopCamera();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to add user",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add user",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const token = localStorage.getItem("adminToken");
      const response = await fetch(api(`/api/admin/users/${userId}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "User deleted successfully",
        });
        fetchUsers();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  const dataURItoBlob = (dataURI: string) => {
    const byteString = atob(dataURI.split(",")[1]);
    const mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add New User</CardTitle>
          <CardDescription>Enroll a new staff member or student</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="userId">User ID</Label>
              <Input
                id="userId"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter unique user ID"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="userName">Name</Label>
              <Input
                id="userName"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter full name"
              />
            </div>
          </div>

          <div className="space-y-4">
            <Label>Capture Method</Label>
            <div className="flex gap-4">
              <Button
                type="button"
                variant={captureMode === "upload" ? "default" : "outline"}
                onClick={() => {
                  setCaptureMode("upload");
                  stopCamera();
                  setCapturedImages([]);
                }}
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Images
              </Button>
              <Button
                type="button"
                variant={captureMode === "camera" ? "default" : "outline"}
                onClick={() => {
                  setCaptureMode("camera");
                  setSelectedFiles([]);
                }}
              >
                <Camera className="mr-2 h-4 w-4" />
                Use Camera
              </Button>
            </div>
          </div>

          {captureMode === "upload" && (
            <div className="space-y-2">
              <Label htmlFor="images">Upload Face Images (multiple)</Label>
              <Input
                id="images"
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setSelectedFiles(Array.from(e.target.files || []))}
              />
              {selectedFiles.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {selectedFiles.length} file(s) selected
                </p>
              )}
            </div>
          )}

          {captureMode === "camera" && (
            <div className="space-y-4">
              {!isCapturing ? (
                <Button onClick={startCamera}>Start Camera</Button>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full max-w-md rounded-lg border"
                  />
                  <div className="flex gap-2">
                    <Button onClick={captureImage}>
                      Capture Image ({capturedImages.length}/20)
                    </Button>
                    <Button variant="outline" onClick={stopCamera}>
                      Stop Camera
                    </Button>
                  </div>
                  {capturedImages.length > 0 && (
                    <div className="grid grid-cols-5 gap-2">
                      {capturedImages.map((img, idx) => (
                        <img
                          key={idx}
                          src={img}
                          alt={`Capture ${idx + 1}`}
                          className="w-full h-20 object-cover rounded border"
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <Button onClick={handleAddUser} className="w-full">
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Registered Users</CardTitle>
          <CardDescription>Manage existing staff and students</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.user_id}>
                  <TableCell className="font-medium">{user.user_id}</TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteUser(user.user_id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
