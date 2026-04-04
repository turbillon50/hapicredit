import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RiMoneyDollarCircleLine, RiCalendarLine } from "react-icons/ri";

export default function ClientPortal() {
  const { user } = useAuth();
  
  // Note: Client Portal API hook not provided directly in spec, stubbing the UI.

  return (
    <Layout title="Mi Portal">
      <div className="space-y-6">
        <Card className="bg-primary text-primary-foreground border-none shadow-md overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <RiMoneyDollarCircleLine className="w-24 h-24" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-primary-foreground/80">Saldo Actual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">
              $5,400.00
            </div>
            <div className="mt-4 bg-primary-foreground/10 rounded-lg p-3 flex justify-between items-center">
              <div>
                <p className="text-xs text-primary-foreground/80 mb-1">Próximo Pago</p>
                <p className="font-semibold flex items-center"><RiCalendarLine className="mr-2" /> 24 de Octubre</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-primary-foreground/80 mb-1">Monto</p>
                <p className="font-semibold">$450.00</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
