import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Building2 } from "lucide-react";

export default function InterviewComplete() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <span className="text-xl font-bold text-primary">RyteFit</span>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full text-center">
          <CardHeader className="pb-4">
            <div className="flex justify-center mb-4">
              <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <CardTitle className="text-2xl" data-testid="text-interview-complete-title">
              Interview Submitted Successfully!
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Thank you for completing your interview
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-6 space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                Your interview responses and video recording have been submitted successfully. 
                Our AI will evaluate your responses, and the hiring team will review your application.
              </p>
              
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4" />
                <span>You will be notified via email about the next steps</span>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                What happens next?
              </p>
              <ul className="text-sm text-left space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="inline-block h-5 w-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                  <span>AI evaluates your interview responses</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="inline-block h-5 w-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                  <span>Hiring team reviews your application</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="inline-block h-5 w-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                  <span>You receive an email with the decision</span>
                </li>
              </ul>
            </div>

            <Button
              variant="outline"
              onClick={() => window.location.href = "/"}
              className="w-full"
              data-testid="button-close-window"
            >
              Go to RyteFit
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
