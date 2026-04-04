import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RiWallet3Line, RiArrowRightDownLine, RiArrowLeftUpLine } from "react-icons/ri";

export default function AdminCaja() {
  return (
    <Layout title="Caja Control">
      <div className="space-y-6">
        <Card className="bg-primary text-primary-foreground border-none shadow-md overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <RiWallet3Line className="w-24 h-24" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-primary-foreground/80">Total Vault Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">
              $142,500.00
            </div>
          </CardContent>
        </Card>

        <h3 className="font-medium text-sm text-muted-foreground px-1">Recent Movements</h3>
        <div className="space-y-3">
          {[1,2,3].map(i => (
            <Card key={i}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${i % 2 === 0 ? 'bg-success/10 text-success' : 'bg-blue-100 text-blue-600'}`}>
                    {i % 2 === 0 ? <RiArrowLeftUpLine className="w-5 h-5" /> : <RiArrowRightDownLine className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-medium text-sm text-foreground">{i % 2 === 0 ? 'Collection Delivery' : 'Disbursement'}</p>
                    <p className="text-xs text-muted-foreground">Executive #{i}</p>
                  </div>
                </div>
                <div className={`font-semibold ${i % 2 === 0 ? 'text-success' : 'text-foreground'}`}>
                  {i % 2 === 0 ? '+' : '-'}$5,000.00
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
