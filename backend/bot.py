import os
import django
import requests

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from telegram import Update, ReplyKeyboardMarkup, KeyboardButton
from telegram.ext import ApplicationBuilder, CommandHandler, MessageHandler, ContextTypes, filters
from store.models import Order

BOT_TOKEN = "9140710434:AAFRQZnQunG5ZQKKrhnfHFaToAAODxntGM0"
API_URL = "http://127.0.0.1:8000/api/orders/"

user_data = {}

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    user_data[user.id] = {}
    await update.message.reply_text(
        f"Assalomu alaykum, {user.first_name}! MKA BOOKS botiga xush kelibsiz.\n"
        "Iltimos, Ism va Familiyangizni kiriting:"
    )

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    text = update.message.text

    if user_id not in user_data:
        user_data[user_id] = {}

    data = user_data[user_id]

    if 'name' not in data:
        data['name'] = text
        await update.message.reply_text("Rahmat! Endi telefon raqamingizni yuboring (masalan: +998901234567):")
    elif 'phone' not in data:
        data['phone'] = text
        location_keyboard = ReplyKeyboardMarkup(
            [[KeyboardButton("📍 Lokatsiyani yuborish", request_location=True)]],
            resize_keyboard=True,
            one_time_keyboard=True
        )
        await update.message.reply_text(
            "Ajoyib! Endi yetkazib berish uchun pastdagi tugmani bosib **GPS lokatsiyangizni** yuboring:",
            reply_markup=location_keyboard
        )
    elif 'address' not in data:
        data['address'] = text
        await update.message.reply_text("Buyurtmangiz qabul qilindi! Tez orada operatorimiz bog'lanadi.")

async def handle_location(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = update.effective_user.id
    location = update.message.location
    data = user_data.get(user_id, {})

    lat = location.latitude
    lon = location.longitude
    map_link = f"https://maps.google.com/?q={lat},{lon}"
    data['location'] = map_link
    data['address'] = data.get('address', 'GPS Lokatsiya') + f" (Kordinatalar: {lat}, {lon})"

    order_payload = {
        "customer_name": data.get('name', 'Telegram Mijoz'),
        "phone": data.get('phone', '+998000000000'),
        "address": data['address'],
        "payment_method": "Telegram Bot (Naqd/Click)",
        "is_paid": False,
        "total_price": 50000,
        "items_summary": f"Telegram bot orqali berilgan buyurtma.\nLokatsiya: {map_link}"
    }

    try:
        res = requests.post(API_URL, json=order_payload)
        if res.status_code == 201:
            await update.message.reply_text(
                "✅ Buyurtmangiz MKA BOOKS bazasiga muvaffaqiyatli saqlandi!\n"
                f"📍 Sizning lokatsiyangiz qabul qilindi: {map_link}\n"
                "Tez orada siz bilan bog'lanamiz."
            )
        else:
            await update.message.reply_text("Xatolik yuz berdi, keyinroq urinib ko'ring.")
    except Exception as e:
        await update.message.reply_text(f"Server bilan aloqada xato: {e}")

if __name__ == '__main__':
    app = ApplicationBuilder().token(BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    app.add_handler(MessageHandler(filters.LOCATION, handle_location))

    print("Telegram bot muvaffaqiyatli ishga tushdi...")
    app.run_polling()
