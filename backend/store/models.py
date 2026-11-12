from django.db import models

class Category(models.Model):
    name = models.CharField(max_length=100, verbose_name="Kategoriya nomi")

    class Meta:
        verbose_name = "Kategoriya"
        verbose_name_plural = "Kategoriyalar"

    def __str__(self):
        return self.name

class Book(models.Model):
    FORMAT_CHOICES = [
        ("Qog'oz", "Qog'oz"),
        ("Elektron", "Elektron"),
        ("Ikkalasi", "Ikkalasi"),
    ]

    title = models.CharField(max_length=200, verbose_name="Kitob nomi")
    author = models.CharField(max_length=150, verbose_name="Muallif")
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='books', verbose_name="Kategoriya")
    price = models.PositiveIntegerField(verbose_name="Narxi (so'm)")
    format = models.CharField(max_length=20, choices=FORMAT_CHOICES, default="Qog'oz", verbose_name="Format")
    description = models.TextField(verbose_name="Tavsif")
    pages = models.PositiveIntegerField(default=200, verbose_name="Sahifalar soni")
    publisher = models.CharField(max_length=150, default="MKA Publishing", verbose_name="Nashriyot")
    image_url = models.URLField(blank=True, null=True, verbose_name="Rasm havolasi (URL)")
    image = models.ImageField(upload_to='books/', blank=True, null=True, verbose_name="Kitob rasmi")
    ebook_file = models.FileField(upload_to='ebooks/', blank=True, null=True, verbose_name="Elektron fayl")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Kitob"
        verbose_name_plural = "Kitoblar"

    def __str__(self):
        return f"{self.title} - {self.author}"

class Order(models.Model):
    STATUS_CHOICES = [
        ("Yangi", "Yangi buyurtma"),
        ("Tasdiqlangan", "Tasdiqlangan"),
        ("Yetkazilmoqda", "Yetkazilmoqda"),
        ("Yakunlangan", "Yakunlangan"),
    ]

    customer_name = models.CharField(max_length=150, verbose_name="Mijoz ismi")
    phone = models.CharField(max_length=30, verbose_name="Telefon raqami")
    address = models.TextField(verbose_name="Manzil")
    payment_method = models.CharField(max_length=50, verbose_name="To'lov turi")
    is_paid = models.BooleanField(default=False, verbose_name="To'langan")
    total_price = models.PositiveIntegerField(verbose_name="Umumiy summa")
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default="Yangi", verbose_name="Holati")
    items_summary = models.TextField(verbose_name="Buyurtma tarkibi")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Sana")

    class Meta:
        verbose_name = "Buyurtma"
        verbose_name_plural = "Buyurtmalar"

    def __str__(self):
        return f"#{self.id} - {self.customer_name} ({self.total_price} so'm)"

class PromoCode(models.Model):
    code = models.CharField(max_length=50, unique=True, verbose_name="Promo-kod")
    discount_percent = models.PositiveIntegerField(verbose_name="Chegirma foizi (%)")
    is_active = models.BooleanField(default=True, verbose_name="Faolligi")

    class Meta:
        verbose_name = "Promo-kod"
        verbose_name_plural = "Promo-kodlar"

    def __str__(self):
        return f"{self.code} ({self.discount_percent}%)"

class Review(models.Model):
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='reviews', verbose_name="Kitob")
    user_name = models.CharField(max_length=100, verbose_name="Foydalanuvchi")
    rating = models.IntegerField(default=5, verbose_name="Reyting (1-5)")
    comment = models.TextField(verbose_name="Sharh matni")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Qo'shilgan sana")

    def __str__(self):
        return f"{self.user_name} - {self.book.title} ({self.rating} yulduz)"
