from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Product, ProductVariant

def home(request):
    return render(request, "index.html")

@api_view(['GET'])
def product_list(request):
    products = Product.objects.all()
    data = []
    for p in products:
        variants = [{"size": v.size, "stock": v.stock} for v in p.variants.all()]
        data.append({
            "id": p.id,
            "name": p.name,
            "price": float(p.price),
            "variants": variants,
            "image": p.image.url if p.image else ""
        })
    return JsonResponse(data, safe=False)

@csrf_exempt
def add_to_cart(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST allowed'}, status=400)

    product_id = request.POST.get('product_id')
    size = request.POST.get('size')
    quantity = int(request.POST.get('quantity', 1))

    try:
        product = Product.objects.get(id=product_id)
        variant = product.variants.get(size=size)

        if quantity > variant.stock:
            return JsonResponse({'error': 'Not enough stock'}, status=400)

        variant.stock -= quantity
        variant.save()

        return JsonResponse({
            'success': True,
            'product': product.name,
            'size': variant.size,
            'remaining_stock': variant.stock
        })

    except Product.DoesNotExist:
        return JsonResponse({'error': 'Product not found'}, status=404)
    except ProductVariant.DoesNotExist:
        return JsonResponse({'error': f'Size {size} not available'}, status=404)
