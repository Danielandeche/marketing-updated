import React, { useEffect, useState } from 'react';
import { observer, useStore } from '@deriv/stores';
import Text from '../text';
import { localize } from '@deriv/translations';

const InstallAppPrompt: React.FC = observer(() => {
    const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
    const [showInstallPrompt, setShowInstallPrompt] = useState(false);
    const { is_dark_mode_on } = useStore().ui;

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowInstallPrompt(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = () => {
        if (deferredPrompt) {
            (deferredPrompt as any).prompt();
            (deferredPrompt as any).userChoice.then((choiceResult: any) => {
                setDeferredPrompt(null);
                setShowInstallPrompt(false);
            });
        }
    };

    const handleClose = () => {
        setShowInstallPrompt(false);
    };

    return (
        <>
            {showInstallPrompt && (
                <div className={`install-app-overlay ${is_dark_mode_on ? 'dark_active' : ''}`}>
                    <div className='install-app-popup'>
                        <Text data-testid='data-title' weight='bold' as='p' align='left' size='s' color='prominent'>
                            {localize("Install Binarytool's app NOW for a faster loading and more better experience!")}
                        </Text>
                        <div className='button-group'>
                            <button className='install_now_button' onClick={handleInstallClick}>
                                Install
                            </button>
                            <button className='no_install_button' onClick={handleClose}>
                                Not Now
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
});

export default InstallAppPrompt;
