from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import FileResponse
from .models import Category, Book, Order, PromoCode
from .serializers import CategorySerializer, BookSerializer, OrderSerializer, PromoCodeSerializer

class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

class BookViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Book.objects.all().order_by('-created_at')
    serializer_class = BookSerializer

class OrderViewSet(viewsets.ModelViewSet):
    queryset = Order.objects.all().order_by('-created_at')
    serializer_class = OrderSerializer

    @action(detail=True, methods=['get'])
    def download_ebook(self, request, pk=None):
        order = self.get_object()
        if not order.is_paid:
            return Response({"error": "Bu buyurtma uchun to'lov qilinmagan!"}, status=400)
        book = Book.objects.filter(format__in=["Elektron", "Ikkalasi"]).first()
        if book and book.ebook_file:
            return FileResponse(book.ebook_file.open(), as_attachment=True, filename=book.ebook_file.name)
        return Response({"error": "Elektron kitob fayli topilmadi."}, status=404)

class PromoCodeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PromoCode.objects.filter(is_active=True)
    serializer_class = PromoCodeSerializer
