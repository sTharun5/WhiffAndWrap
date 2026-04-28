export interface ProductInfo {
    id: string;
    name: string;
    description: string;
    price: number | string;
    image: string;
    personalization?: Record<string, string>;
    customImage?: string;
}

export function generateInstagramMessage(product: ProductInfo): string {
    let message = `ORDER INQUIRY: #${product.id}
    
I would like to order "${product.name}" from Whiff & Wrap.

- Product ID: #${product.id}
- Name: ${product.name}
- Price: ₹${typeof product.price === 'number' ? product.price.toLocaleString('en-IN') : product.price}
- Details: ${product.description}`;

    if (product.personalization && Object.keys(product.personalization).length > 0) {
        message += `\n\nPERSONALIZATION:`;
        Object.entries(product.personalization).forEach(([key, value]) => {
            if (value) {
                const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                message += `\n- ${label}: ${value}`;
            }
        });
    }

    if (product.customImage) {
        message += `\n- Custom Image: ${product.customImage}`;
    }

    message += `\n\nProduct Link: ${window.location.origin}/products/${product.id}`;
    
    return message;
}


export function openInstagramDM(product: ProductInfo) {
    const message = generateInstagramMessage(product);
    const encodedMessage = encodeURIComponent(message);
    const username = '_whiffandwrap_';

    // 1. Copy to clipboard (Essential reliability for all platforms)
    navigator.clipboard.writeText(message).then(() => {
        // 2. Redirection Strategy
        // We detect mobile to use deep links which are more consistent in the app
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        
        if (isMobile) {
            // Instagram App Deep Links
            // direct_share is often the most consistent for pre-filling text in the app
            const appLink = `instagram://direct_share?text=${encodedMessage}`;
            // Fallback for app link (just open chat)
            const chatLink = `instagram://user?username=${username}`;
            
            // On mobile, we try the app link
            window.location.href = appLink;
            
            // Fallback after a short delay if app doesn't open
            setTimeout(() => {
                window.open(`https://ig.me/m/${username}?text=${encodedMessage}`, '_blank');
            }, 1500);
        } else {
            // Desktop experience
            window.open(`https://ig.me/m/${username}?text=${encodedMessage}`, '_blank');
        }
    }).catch(err => {
        console.error('Could not copy text: ', err);
        window.open(`https://ig.me/m/${username}`, '_blank');
    });
}




