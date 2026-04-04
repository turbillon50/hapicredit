import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { useCreatePayment, getListClientsQueryKey, useListClients, getListCreditsQueryKey, useListCredits } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export default function ExecutivePaymentsNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const createPayment = useCreatePayment();
  
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedCreditId, setSelectedCreditId] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  const { data: clients } = useListClients(
    { executiveId: user?.id },
    { query: { enabled: !!user?.id, queryKey: getListClientsQueryKey({ executiveId: user?.id }) } }
  );

  const { data: credits } = useListCredits(
    { clientId: Number(selectedClientId) },
    { query: { enabled: !!selectedClientId, queryKey: getListCreditsQueryKey({ clientId: Number(selectedClientId) }) } }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId || !selectedCreditId || !amount) return;

    try {
      await createPayment.mutateAsync({
        data: {
          clientId: Number(selectedClientId),
          creditId: Number(selectedCreditId),
          amountPaid: Number(amount),
          paymentDate: new Date().toISOString(),
          executiveId: user?.id,
          notes
        }
      });
      toast({ title: "Payment registered successfully" });
      setLocation(`/clients/${selectedClientId}`);
    } catch (error) {
      toast({ title: "Failed to register payment", variant: "destructive" });
    }
  };

  return (
    <Layout title="Register Payment">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Payment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Client</Label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients?.map(client => (
                    <SelectItem key={client.id} value={client.id.toString()}>{client.fullName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Credit</Label>
              <Select value={selectedCreditId} onValueChange={setSelectedCreditId} disabled={!selectedClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select active credit" />
                </SelectTrigger>
                <SelectContent>
                  {credits?.map(credit => (
                    <SelectItem key={credit.id} value={credit.id.toString()}>Credit #{credit.id} - ${credit.remainingBalance} remaining</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount Paid</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input id="amount" type="number" step="0.01" className="pl-7" required value={amount} onChange={e => setAmount(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} />
            </div>

            <Button type="submit" className="w-full mt-6" disabled={createPayment.isPending || !selectedCreditId}>
              {createPayment.isPending ? "Processing..." : "Confirm Payment"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Layout>
  );
}
