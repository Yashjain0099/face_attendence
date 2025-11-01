import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Download, Filter } from "lucide-react";
import { api } from "@/lib/api";

interface AttendanceRecord {
  id: number;
  user_id: string;
  name: string;
  timestamp: string;
}

const AttendanceReports = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [fromDate, setFromDate] = useState(new Date().toISOString().split("T")[0]);
  const [toDate, setToDate] = useState(new Date().toISOString().split("T")[0]);
  const [userFilter, setUserFilter] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const params = new URLSearchParams({
        from_date: fromDate,
        to_date: toDate,
        user: userFilter,
      });

      const response = await fetch(
        api(`/api/admin/attendance?${params}`),
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json();

      if (data.success) {
        setRecords(data.records);
        setTotalCount(data.total_unique);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch attendance records",
        variant: "destructive",
      });
    }
  };

  const exportToCSV = () => {
    const headers = ["User ID", "Name", "Date", "Time"];
    const rows = records.map((record) => {
      const date = new Date(record.timestamp);
      return [
        record.user_id,
        record.name,
        date.toLocaleDateString(),
        date.toLocaleTimeString(),
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance_${fromDate}_to_${toDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Attendance report exported",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Filter Attendance Records</CardTitle>
          <CardDescription>
            Filter and export attendance data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fromDate">From Date</Label>
              <Input
                id="fromDate"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="toDate">To Date</Label>
              <Input
                id="toDate"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="userFilter">User ID/Name</Label>
              <Input
                id="userFilter"
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                placeholder="Filter by user"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchRecords}>
              <Filter className="mr-2 h-4 w-4" />
              Apply Filters
            </Button>
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
          <CardDescription>
            Total Unique Attendees: <span className="font-bold">{totalCount}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => {
                const date = new Date(record.timestamp);
                return (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.user_id}</TableCell>
                    <TableCell>{record.name}</TableCell>
                    <TableCell>{date.toLocaleDateString()}</TableCell>
                    <TableCell>{date.toLocaleTimeString()}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {records.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No attendance records found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceReports;
