import os
import json
import requests
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db.models import Sum
import google.generativeai as genai
from api.models import Order, Branch, Expense
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Command(BaseCommand):
    help = 'Generates an AI summary of daily sales and sends via WhatsApp using Gemini'

    def handle(self, *args, **kwargs):
        today = timezone.now().date()
        
        # --- 1. Gather the Data from Django ORM ---
        self.stdout.write("Fetching daily data from database...")
        branches = Branch.objects.all()
        report_data = []
        total_network_revenue = 0
        total_network_expenses = 0

        for branch in branches:
            # Sum up today's orders
            daily_orders = Order.objects.filter(branch=branch, created_at__date=today)
            branch_revenue = daily_orders.aggregate(Sum('total_amount'))['total_amount__sum'] or 0
            
            # Sum up today's expenses
            daily_expenses = Expense.objects.filter(branch=branch, date=today)
            branch_expenses = daily_expenses.aggregate(Sum('amount'))['amount__sum'] or 0

            report_data.append({
                "branch": branch.name,
                "revenue": float(branch_revenue),
                "expenses": float(branch_expenses),
                "order_count": daily_orders.count()
            })
            total_network_revenue += branch_revenue
            total_network_expenses += branch_expenses

        # --- 2. Feed to Gemini AI ---
        self.stdout.write("Generating AI analysis with Gemini...")
        
        # Configure Gemini API
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            self.stdout.write(self.style.ERROR('GEMINI_API_KEY is missing!'))
            return

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.5-flash')

        raw_stats = f"Date: {today}. Total Revenue: PKR {total_network_revenue}. Total Expenses: PKR {total_network_expenses}. Branch Breakdown: {json.dumps(report_data)}"
        
        prompt = f"""
        You are an expert AI business consultant for a restaurant chain called Nashta POS. 
        Analyze the following daily sales and expense data and write a short, highly encouraging WhatsApp message to the restaurant owner. 
        
        Rules for the message:
        1. Highlight the top-performing branch by revenue.
        2. Mention the total network revenue, total expenses, and net profit.
        3. If expenses are higher than 50% of revenue, add a gentle strategic warning to keep an eye on costs tomorrow.
        4. Keep it concise, punchy, and formatted perfectly for WhatsApp (use *bold* for numbers and emojis).
        5. Do not sound like a robot; sound like a sharp, friendly human business partner.
        
        Data: {raw_stats}
        """
        
        try:
            response = model.generate_content(prompt)
            ai_generated_message = response.text
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"AI Generation Failed: {e}"))
            return

        self.stdout.write(f"\n--- GENERATED MESSAGE ---\n{ai_generated_message}\n-------------------------\n")

        # --- 3. Send via Twilio WhatsApp ---
        self.stdout.write("Sending to WhatsApp...")
        
        TWILIO_SID = os.environ.get('TWILIO_SID')
        TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN')
        FROM_WHATSAPP = os.environ.get('TWILIO_WHATSAPP_NUMBER') 
        TO_WHATSAPP = os.environ.get('OWNER_WHATSAPP_NUMBER') 

        if not all([TWILIO_SID, TWILIO_AUTH_TOKEN, FROM_WHATSAPP, TO_WHATSAPP]):
            self.stdout.write(self.style.WARNING('Twilio credentials missing. Skipping WhatsApp send step.'))
            return

        url = f"https://api.twilio.com/2010-04-01/Accounts/{TWILIO_SID}/Messages.json"
        payload = {
            "From": FROM_WHATSAPP,
            "To": TO_WHATSAPP,
            "Body": ai_generated_message
        }
        
        try:
            res = requests.post(url, data=payload, auth=(TWILIO_SID, TWILIO_AUTH_TOKEN))
            res.raise_for_status()
            self.stdout.write(self.style.SUCCESS('Successfully sent daily AI briefing! 🚀'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Twilio API Failed: {e}"))