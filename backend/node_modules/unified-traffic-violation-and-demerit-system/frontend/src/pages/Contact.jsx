import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, MapPin } from "lucide-react";

function Contact() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen p-6 bg-background text-foreground grid place-items-center">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Contact Administrator</CardTitle>
          <CardDescription>Get in touch with our support team</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start gap-4">
            <Mail className="w-5 h-5 text-primary mt-1" />
            <div>
              <h3 className="font-semibold mb-1">Email</h3>
              <p className="text-muted-foreground">admin@utvds.gov.ph</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <Phone className="w-5 h-5 text-primary mt-1" />
            <div>
              <h3 className="font-semibold mb-1">Phone</h3>
              <p className="text-muted-foreground">+63 (2) 1234-5678</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <MapPin className="w-5 h-5 text-primary mt-1" />
            <div>
              <h3 className="font-semibold mb-1">Office</h3>
              <p className="text-muted-foreground">LGU Building, Quezon City, Metro Manila</p>
            </div>
          </div>
          
          <div className="pt-4">
            <Button onClick={() => navigate("/")} variant="outline" className="w-full">
              Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default Contact;