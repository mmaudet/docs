import { Button } from '@gouvfr-lasuite/cunningham-react';
import Head from 'next/head';
import Image from 'next/image';
import { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import error_img from '@/assets/icons/error-coffee.png';
import { Box, Icon, StyledLink, Text } from '@/components';
import { PageLayout } from '@/layouts';
import { NextPageWithLayout } from '@/types/next';

const StyledButton = styled(Button)`
  width: fit-content;
`;

const Page: NextPageWithLayout = () => {
  const { t } = useTranslation();

  const errorTitle = t('An unexpected error occurred.');

  return (
    <>
      <Head>
        <title>
          {errorTitle} - {t('Docs')}
        </title>
        <meta
          property="og:title"
          content={`${errorTitle} - ${t('Docs')}`}
          key="title"
        />
      </Head>
      <Box
        $align="center"
        $margin="auto"
        $gap="md"
        $padding={{ bottom: '2rem' }}
      >
        <Text as="h1" $textAlign="center" className="sr-only">
          {errorTitle} - {t('Docs')}
        </Text>
        <Image
          src={error_img}
          alt=""
          width={300}
          style={{
            maxWidth: '100%',
            height: 'auto',
          }}
        />

        <Text
          as="p"
          $textAlign="center"
          $maxWidth="350px"
          $theme="neutral"
          $margin="0"
        >
          {t(
            'An unexpected error occurred. Go grab a coffee or try to refresh the page.',
          )}
        </Text>

        <Box $direction="row" $gap="sm">
          <StyledLink href="/">
            <StyledButton
              color="neutral"
              icon={
                <Icon
                  iconName="house"
                  variant="symbols-outlined"
                  $withThemeInherited
                />
              }
            >
              {t('Home')}
            </StyledButton>
          </StyledLink>

          <StyledButton
            color="neutral"
            variant="bordered"
            icon={
              <Icon
                iconName="refresh"
                variant="symbols-outlined"
                $withThemeInherited
              />
            }
            onClick={() => window.location.reload()}
          >
            {t('Refresh page')}
          </StyledButton>
        </Box>
      </Box>
    </>
  );
};

Page.getLayout = function getLayout(page: ReactElement) {
  return <PageLayout withFooter={false}>{page}</PageLayout>;
};

export default Page;
