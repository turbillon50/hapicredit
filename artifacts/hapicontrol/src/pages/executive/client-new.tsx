import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { useCreateClient } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export default function ExecutiveClientNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const createClient = useCreateClient();
  
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    altPhone: "",
    address: "",
    curp: "",
    guarantorName: "",
    guarantorPhone: "",
    internalNotes: ""
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const client = await createClient.mutateAsync({
        data: {
          ...formData,
          executiveId: user?.id,
        }
      });
      toast({ title: "Client registered successfully" });
      setLocation(`/clients/${client.id}`);
    } catch (error) {
      toast({ title: "Failed to register client", variant: "destructive" });
    }
  };

  return (
    <Layout title="New Client">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Client Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input id="fullName" name="fullName" required value={formData.fullName} onChange={handleChange} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input id="phone" name="phone" type="tel" required value={formData.phone} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea id="address" name="address" value={formData.address} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="curp">CURP</Label>
              <Input id="curp" name="curp" value={formData.curp} onChange={handleChange} />
            </div>
            
            <div className="pt-4 border-t border-border">
              <h3 className="font-medium mb-4 text-sm">Guarantor Information</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="guarantorName">Guarantor Name</Label>
                  <Input id="guarantorName" name="guarantorName" value={formData.guarantorName} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guarantorPhone">Guarantor Phone</Label>
                  <Input id="guarantorPhone" name="guarantorPhone" type="tel" value={formData.guarantorPhone} onChange={handleChange} />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full mt-6" disabled={createClient.isPending}>
              {createClient.isPending ? "Registering..." : "Register Client"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Layout>
  );
}
