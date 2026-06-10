import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ProductQueryDto } from './dto/product-query.dto.js';
import { ProductSort } from './dto/product-sort.enum.js';
import { ProductAvailability } from './dto/product-availability.enum.js';
import { AppErrorCodes } from '../common/errors/app-error-codes.js';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async getCategories() {
    return this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        iconUrl: true,
        displayOrder: true,
      },
    });
  }

  async getProducts(query: ProductQueryDto) {
    const {
      categoryId,
      categorySlug,
      search,
      tag,
      minPrice,
      maxPrice,
      isFeatured,
      availability = ProductAvailability.ALL,
      sort = ProductSort.RELEVANCE,
      limit = 20,
      page = 1,
    } = query;

    const where: Prisma.ProductWhereInput = {
      status: 'active',
    };

    if (availability === ProductAvailability.AVAILABLE) {
      where.isAvailable = true;
    } else if (availability === ProductAvailability.UNAVAILABLE) {
      where.isAvailable = false;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    } else if (categorySlug) {
      where.category = { slug: categorySlug };
    }

    if (isFeatured !== undefined) {
      where.isFeatured = isFeatured;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (tag) {
      where.productTags = {
        some: {
          tag: {
            name: { equals: tag, mode: 'insensitive' },
          },
        },
      };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.basePrice = {};
      if (minPrice !== undefined) where.basePrice.gte = minPrice;
      if (maxPrice !== undefined) where.basePrice.lte = maxPrice;
    }

    let orderBy:
      | Prisma.ProductOrderByWithRelationInput
      | Prisma.ProductOrderByWithRelationInput[] = [];
    switch (sort) {
      case ProductSort.PRICE_ASC:
        orderBy = { basePrice: 'asc' };
        break;
      case ProductSort.PRICE_DESC:
        orderBy = { basePrice: 'desc' };
        break;
      case ProductSort.POPULARITY:
        orderBy = [{ isFeatured: 'desc' }, { name: 'asc' }];
        break;
      case ProductSort.RELEVANCE:
      default:
        orderBy = [{ isFeatured: 'desc' }, { name: 'asc' }];
        break;
    }

    const skip = (page - 1) * limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          description: true,
          basePrice: true,
          imageUrl: true,
          status: true,
          isAvailable: true,
          isFeatured: true,
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          productVariants: {
            select: {
              id: true,
              name: true,
              priceModifier: true,
              isDefault: true,
              isAvailable: true,
            },
            orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
          },
          productTags: {
            select: {
              tag: {
                select: {
                  id: true,
                  name: true,
                  tagType: true,
                  colorHex: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    const formattedItems = items.map((item) => {
      const { productTags, productVariants, ...rest } = item;
      return {
        ...rest,
        tags: productTags.map((pt) => pt.tag),
        variants: productVariants,
      };
    });

    return {
      items: formattedItems,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getProductDetail(id: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        id,
        status: 'active',
      },
      select: {
        id: true,
        name: true,
        description: true,
        basePrice: true,
        imageUrl: true,
        status: true,
        isAvailable: true,
        isFeatured: true,
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        productVariants: {
          select: {
            id: true,
            name: true,
            priceModifier: true,
            isDefault: true,
            isAvailable: true,
          },
          orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
        },
        productTags: {
          select: {
            tag: {
              select: {
                id: true,
                name: true,
                tagType: true,
                colorHex: true,
              },
            },
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException({
        code: AppErrorCodes.PRODUCT_NOT_FOUND,
        message: 'Product not found.',
      });
    }

    const { productTags, productVariants, ...rest } = product;
    return {
      ...rest,
      tags: productTags.map((pt) => pt.tag),
      variants: productVariants,
    };
  }
}
