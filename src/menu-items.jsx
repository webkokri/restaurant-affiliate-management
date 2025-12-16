const getMenuItems = (customerData) => {
  const isAdmin = customerData?.role === 'admin';

  const menuItems = {
    items: [
      {
        id: 'navigation',
        title: 'Navigation',
        type: 'group',
        icon: 'icon-navigation',
        children: [
          {
            id: 'dashboard',
            title: 'Dashboard',
            type: 'item',
            icon: 'feather icon-home',
            url: '/app/dashboard/analytics'
          }
        ]
      },
      {
        id: 'utilities',
        title: 'Referrals',
        type: 'group',
        icon: 'icon-ui',
        children: [
          {
            id: 'component',
            title: 'Referrals',
            type: 'collapse',
            icon: 'feather icon-box',
            children: [
              {
                id: 'all-referrals',
                title: 'All Referrals',
                type: 'item',
                url: '/app/referrals/all'
              },
              {
                id: 'redeemed-codes',
                title: 'Redeemed Codes',
                type: 'item',
                url: '/app/referrals/codes'
              },
              ...(isAdmin
                ? [
                    {
                      id: 'verify-code',
                      title: 'Verify Code',
                      type: 'item',
                      url: '/app/referrals/verify'
                    }
                  ]
                : [])
            ]
          }
        ]
      },
      {
        id: 'support',
        title: 'Support',
        type: 'group',
        icon: 'icon-support',
        children: []
      }
    ]
  };

  return menuItems;
};

export default getMenuItems;
