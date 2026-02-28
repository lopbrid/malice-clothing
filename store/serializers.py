from rest_framework import serializers
from .models import Product, ProductVariant, Order, OrderItem

# Variant Serializer
class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = ['id','size','stock']

# Product Serializer with variants
class ProductSerializer(serializers.ModelSerializer):
    variants = ProductVariantSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = ['id','name','price','image','variants']

# OrderItem Serializer (input only)
class OrderItemSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    size = serializers.CharField()
    quantity = serializers.IntegerField()

# Order Serializer
class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, write_only=True)

    class Meta:
        model = Order
        fields = ['id','customer_name','address','phone','payment_method','items','created_at']

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        order = Order.objects.create(**validated_data)

        for item in items_data:
            product = Product.objects.get(id=item['product_id'])
            variant = product.variants.get(size=item['size'])

            if item['quantity'] > variant.stock:
                raise serializers.ValidationError(
                    f"Not enough stock for {product.name} size {variant.size}!"
                )

            # Reduce stock
            variant.stock -= item['quantity']
            variant.save()

            OrderItem.objects.create(
                order=order,
                product=product,
                size=variant.size,
                quantity=item['quantity'],
                price=product.price
            )
        return order
